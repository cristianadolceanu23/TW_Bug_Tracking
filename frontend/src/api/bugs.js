import api from "./api";

/* Endpoint-uri de bug-uri
   Cerinte tema:
   - TST: raportare bug cu severity/priority/description + tested commit
   - MP: assign to me (un singur MP)
   - MP: resolve + resolved commit */

export async function getBugsByProject(projectId) {
  const res = await api.get("/bugs/project/" + projectId);
  return res.data;
}

export async function createBug(payload) {
  const res = await api.post("/bugs", payload);
  return res.data;
}

export async function assignBugToMe(bugId) {
  const res = await api.patch("/bugs/" + bugId + "/assign");
  return res.data;
}

export async function resolveBug(bugId, payload) {
  const res = await api.patch("/bugs/" + bugId + "/resolve", payload);
  return res.data;
}
