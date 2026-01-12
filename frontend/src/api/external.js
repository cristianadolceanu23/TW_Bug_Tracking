import api from "./api";

/* Serviciu extern (cerinta template) */

export async function getGithubRepoInfo(repoUrl) {
  const res = await api.get("/external/github/repo", { params: { url: repoUrl } });
  return res.data;
}
