import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createProject,
  getAllProjects,
  getMyProjects,
  joinProjectAsTester,
} from "../api/projects";

/* Dashboard:
   - Cerinta: MP poate crea proiect
   - Cerinta: student non-member vede proiecte si se poate inscrie ca tester
   - Cerinta: afisam rolul (MP/TST) pentru proiectele din care facem parte */

export default function Dashboard() {
  const navigate = useNavigate();

  const [myProjects, setMyProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  const [name, setName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const reload = async () => {
    setError("");
    setInfo("");

    try {
      const mine = await getMyProjects();
      setMyProjects(mine);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load my projects");
      return;
    }

    // daca backend nu are inca /projects/all, nu blocam aplicatia
    try {
      const all = await getAllProjects();
      setAllProjects(all);
    } catch {
      setAllProjects([]);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

  // Validare GitHub repo (cu trim)
  const repo = repositoryUrl.trim();
  if (!repo.startsWith("https://github.com/")) {
    setError("Repository URL must start with https://github.com/");
    return;
  }

    try {
      await createProject({ name: name.trim(), repositoryUrl: repo });
      setName("");
      setRepositoryUrl("");
      setInfo("Project created");
      await reload();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Could not create project");
    }
  };

  const handleJoin = async (projectId) => {
    setError("");
    setInfo("");

    try {
      await joinProjectAsTester(projectId);
      setInfo("Joined as tester");
      await reload();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not join project");
    }
  };

  const openProject = (projectId) => {
    navigate("/projects/" + projectId);
  };

  return (
    <div className="container">
      <div className="row">
        <h2 style={{ margin: 0 }}>Bug Tracker</h2>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </div>

      {error && <p className="msg-error">{error}</p>}
      {info && <p className="msg-success">{info}</p>}

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Create project (MP)</h3>
        <form className="stack" onSubmit={handleCreateProject}>
          <input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Repository URL (GitHub)"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
          />
          <button>Create</button>
          <p className="muted" style={{ margin: 0 }}>
            Note: Orice utilizator autentificat poate crea un proiect. Creatorul devine automat MP pentru proiectul creat.
          </p>
        </form>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>My projects</h3>
          {myProjects.length === 0 ? (
            <p className="muted">No projects yet.</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {myProjects.map((p) => (
                <li key={p.id} style={{ marginBottom: 10 }}>
                  <div className="row">
                    <div>
                      <b>{p.name}</b>{" "}
                      <span className="badge">{p.role || "member"}</span>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.repositoryUrl}
                      </div>
                    </div>
                    <button onClick={() => openProject(p.id)}>Open</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>All projects</h3>
          {allProjects.length === 0 ? (
            <p className="muted">
              Daca nu apar proiecte aici, endpoint-ul GET /projects/all nu este inca disponibil
            </p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {allProjects.map((p) => (
                <li key={p.id} style={{ marginBottom: 10 }}>
                  <div className="row">
                    <div>
                      <b>{p.name}</b>{" "}
                      {p.role ? (
                        <span className="badge">{p.role}</span>
                      ) : (
                        <span className="badge">non-member</span>
                      )}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.repositoryUrl}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="secondary" onClick={() => openProject(p.id)}>
                        Open
                      </button>

                      {!p.role && (
                        <button onClick={() => handleJoin(p.id)}>
                          Join as Tester
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
