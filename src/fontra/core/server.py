from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import partial
from http.cookies import SimpleCookie
from importlib import resources
from importlib.metadata import entry_points
import logging
import mimetypes
import traceback
from urllib.parse import quote
from aiohttp import WSCloseCode, web
from .remote import RemoteObjectConnection, RemoteObjectConnectionException


logger = logging.getLogger(__name__)


@dataclass(kw_only=True)
class FontraServer:

    host: str
    httpPort: int
    projectManager: object
    cookieMaxAge: int = 7 * 24 * 60 * 60
    allowedFileExtensions: set = frozenset(["css", "html", "ico", "js", "svg", "woff2"])

    def setup(self):
        self.startupTime = datetime.now(timezone.utc).replace(microsecond=0)
        self.httpApp = web.Application()
        self.viewEntryPoints = {
            ep.name: ep.value for ep in entry_points(group="fontra.views")
        }
        if hasattr(self.projectManager, "setupWebRoutes"):
            self.projectManager.setupWebRoutes(self)
        routes = []
        routes.append(web.get("/", self.rootDocumentHandler))
        routes.append(web.get("/websocket/{path:.*}", self.websocketHandler))
        for ep in entry_points(group="fontra.webcontent"):
            routes.append(
                web.get(
                    f"/{ep.name}/{{path:.*}}",
                    partial(self.staticContentHandler, ep.value),
                )
            )
        for viewName, viewPackage in self.viewEntryPoints.items():
            routes.append(
                web.get(
                    f"/{viewName}/-/{{path:.*}}",
                    partial(self.viewPathHandler, viewName),
                )
            )
            routes.append(
                web.get(
                    f"/{viewName}/{{path:.*}}",
                    partial(self.staticContentHandler, viewPackage),
                )
            )
        routes.append(
            web.get("/{path:.*}", partial(self.staticContentHandler, "fontra.client"))
        )
        self.httpApp.add_routes(routes)
        self.httpApp.on_shutdown.append(self.closeActiveWebsockets)
        self.httpApp.on_shutdown.append(self.projectManager.close)
        self._activeWebsockets = set()

    def run(self):
        host = self.host
        httpPort = self.httpPort
        pad = " " * (22 - len(str(httpPort)) - len(host))
        print("+---------------------------------------------------+")
        print("|                                                   |")
        print("|      Fontra!                                      |")
        print("|                                                   |")
        print("|      Navigate to:                                 |")
        print(f"|      http://{host}:{httpPort}/{pad}              |")
        print("|                                                   |")
        print("+---------------------------------------------------+")
        web.run_app(self.httpApp, host=host, port=httpPort)

    async def closeActiveWebsockets(self, httpApp):
        for websocket in list(self._activeWebsockets):
            await websocket.close(
                code=WSCloseCode.GOING_AWAY, message="Server shutdown"
            )

    async def websocketHandler(self, request):
        path = "/" + request.match_info["path"]
        logger.info(f"incoming connection: {path!r}")

        cookies = SimpleCookie()
        cookies.load(request.headers.get("Cookie", ""))
        cookies = {k: v.value for k, v in cookies.items()}
        token = cookies.get("fontra-authorization-token")

        websocket = web.WebSocketResponse()
        await websocket.prepare(request)
        self._activeWebsockets.add(websocket)
        try:
            subject = await self.getSubject(websocket, path, token)
        except RemoteObjectConnectionException as e:
            logger.info("refused websocket request: %s", e)
            await websocket.close()
        except Exception as e:
            logger.error("error while handling incoming websocket messages: %r", e)
            traceback.print_exc()
            await websocket.close()
        else:
            connection = RemoteObjectConnection(websocket, path, subject, True)
            with subject.useConnection(connection):
                await connection.handleConnection()
        finally:
            self._activeWebsockets.discard(websocket)

        return websocket

    async def getSubject(self, websocket, path, token):
        subject = await self.projectManager.getRemoteSubject(path, token)
        if subject is None:
            raise RemoteObjectConnectionException("unauthorized")
        return subject

    async def staticContentHandler(self, packageName, request):
        ifModSince = request.if_modified_since
        if ifModSince is not None and ifModSince >= self.startupTime:
            return web.HTTPNotModified()

        pathItems = [""] + request.match_info["path"].split("/")
        modulePath = packageName + ".".join(pathItems[:-1])
        resourceName = pathItems[-1]
        try:
            data = resources.read_binary(modulePath, resourceName)
        except (FileNotFoundError, IsADirectoryError, ModuleNotFoundError):
            return web.HTTPNotFound()
        ext = resourceName.rsplit(".", 1)[-1].lower()
        if ext not in self.allowedFileExtensions:
            return web.HTTPNotFound()
        contentType, _ = mimetypes.guess_type(resourceName)
        response = web.Response(body=data, content_type=contentType)
        response.last_modified = self.startupTime
        return response

    async def notFoundHandler(self, request):
        return web.HTTPNotFound()

    async def rootDocumentHandler(self, request):
        response = await self.projectManager.projectPageHandler(request)
        response.set_cookie("fontra-version-token", str(self.startupTime))
        return response

    async def viewPathHandler(self, viewName, request):
        authToken = await self.projectManager.authorize(request)
        if not authToken:
            qs = quote(request.path_qs, safe="")
            response = web.HTTPFound(f"/?ref={qs}")
            return response

        path = request.match_info["path"]
        if not await self.projectManager.projectAvailable(authToken, path):
            return web.HTTPNotFound()

        try:
            html = resources.read_text(
                self.viewEntryPoints[viewName], f"{viewName}.html"
            )
        except (FileNotFoundError, ModuleNotFoundError):
            return web.HTTPNotFound()

        response = web.Response(text=html, content_type="text/html")
        response.set_cookie("fontra-version-token", str(self.startupTime))
        return response
