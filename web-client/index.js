import { Backend, setBackend } from "@fontra/core/backend-api.js";

async function populateProjectList() {
  let projects = await Backend.getProjects();
  let projectList = document.getElementById("server-project-list");
  projectList.innerHTML = "";
  for (let project of projects) {
    let projectElement = document.createElement("li");
    projectElement.textContent = project;
    projectElement.addEventListener("click", function () {
      window.location.href = "editor.html/" + project;
    });
    projectList.appendChild(projectElement);
  }
}
document.getElementById("open-gh").addEventListener("click", function () {
  localStorage.setItem("fontraBackend", "rust");
  window.location.href =
    "editor.html?https://cdn.jsdelivr.net/gh/" +
    document.getElementById("username").value +
    "/" +
    document.getElementById("repository").value +
    "/" +
    document.getElementById("filepath").value;
});
document.getElementById("open-local").addEventListener("click", function () {
  localStorage.setItem("fontraBackend", "python");
  let args = {
    host: document.getElementById("server-host").value,
    port: document.getElementById("server-port").value,
    secure: document.getElementById("server-secure").checked,
  };

  localStorage.setItem("fontraBackendArgs", JSON.stringify(args));
  setBackend("python", args);
  console.log("Go");
  populateProjectList();
});

document.getElementById("new-browser-project").addEventListener("click", function () {
  localStorage.setItem("fontraBackend", "rust");
  window.location.href = "editor.html?";
});
