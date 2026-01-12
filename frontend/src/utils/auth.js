/* Helper simplu: decodam payload-ul JWT
   Ne ajuta in UI pentru logica "assigned to me" */

export function getCurrentUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
