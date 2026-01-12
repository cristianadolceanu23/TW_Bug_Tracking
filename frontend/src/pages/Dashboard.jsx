import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const loadProjects = async () => {
    setError("");
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load projects");
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
    else loadProjects();
    // eslint-disable-next-line
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/projects", { name, repositoryUrl });
      setName("");
      setRepositoryUrl("");
      loadProjects();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create project");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Dashboard</h2>
        <button onClick={logout} style={{ cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <h3>Create project</h3>
      <form onSubmit={createProject} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Repository URL"
          value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
          style={{ padding: 10 }}
        />
        <button style={{ padding: 10, cursor: "pointer" }}>Create</button>
      </form>

      <h3 style={{ marginTop: 30 }}>My projects</h3>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <b>{p.name}</b> — {p.repositoryUrl} {p.role ? `(role: ${p.role})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
