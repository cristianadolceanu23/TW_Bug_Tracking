import api from "./api";

/* Endpoint-uri de proiecte */

export async function getMyProjects() {
  const res = await api.get("/projects");
  return res.data;
}

export async function getAllProjects() {
  const res = await api.get("/projects/all");
  return res.data;
}

export async function createProject(payload) {
  const res = await api.post("/projects", payload);
  return res.data;
}

export async function joinProjectAsTester(projectId) {
  const res = await api.post("/projects/" + projectId + "/join");
  return res.data;
}

export async function updateProject(projectId, payload) {
  const res = await api.patch("/projects/" + projectId, payload);
  return res.data;
}
