from __future__ import annotations

import argparse
from types import SimpleNamespace
from typing import Any, Awaitable, Callable, Protocol, runtime_checkable

from aiohttp import web

from .classes import GlobalAxis, GlobalDiscreteAxis, VariableGlyph


@runtime_checkable
class ReadableFontBackend(Protocol):
    async def aclose(self) -> None:
        pass

    async def getGlyph(self, glyphName: str) -> VariableGlyph | None:
        pass

    async def getGlobalAxes(self) -> list[GlobalAxis | GlobalDiscreteAxis]:
        pass

    async def getGlyphMap(self) -> dict[str, list[int]]:
        pass

    async def getCustomData(self) -> dict[str, Any]:
        pass

    async def getUnitsPerEm(self) -> int:
        pass


@runtime_checkable
class WritableFontBackend(ReadableFontBackend, Protocol):
    async def putGlyph(
        self, glyphName: str, glyph: VariableGlyph, codePoints: list[int]
    ) -> None:
        pass

    async def deleteGlyph(self, glyphName: str) -> None:
        pass

    async def putGlobalAxes(self, value: list[GlobalAxis | GlobalDiscreteAxis]) -> None:
        pass

    async def putGlyphMap(self, value: dict[str, list[int]]) -> None:
        pass

    async def putCustomData(self, value: dict[str, Any]) -> None:
        pass

    async def putUnitsPerEm(self, value: int) -> None:
        pass


@runtime_checkable
class WatchableFontBackend(Protocol):
    async def watchExternalChanges(
        self, callback: Callable[[Any, Any], Awaitable[None]]
    ) -> None:
        pass


@runtime_checkable
class ProjectManagerFactory(Protocol):
    @staticmethod
    def addArguments(parser: argparse.ArgumentParser) -> None:
        pass

    @staticmethod
    def getProjectManager(arguments: SimpleNamespace) -> ProjectManager:
        pass


@runtime_checkable
class ProjectManager(Protocol):
    async def aclose(self) -> None:
        pass

    async def authorize(self, request: web.Request) -> str | None:
        pass

    async def projectAvailable(self, path: str, token: str) -> bool:
        pass

    async def getRemoteSubject(self, path: str, token: str) -> Any:
        pass

    async def getProjectList(self, token: str) -> list[str]:
        pass

    async def projectPageHandler(
        self, request: web.Request, filterContent: Callable | None = None
    ) -> web.Response:
        pass

    def setupWebRoutes(self, server) -> None:
        pass
