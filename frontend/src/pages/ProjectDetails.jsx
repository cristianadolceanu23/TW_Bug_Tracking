import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBugsByProject, createBug, assignBugToMe, resolveBug } from "../api/bugs";
import { getGithubRepoInfo } from "../api/external";
import { getCurrentUserFromToken } from "../utils/auth";
import { getMyProjects, getAllProjects, joinProjectAsTester, updateProject, addTesterToProject } from "../api/projects";


/* ProjectDetails:
   Aici demonstram aproape toate cerintele:
   - non-member: Join as Tester
   - TST: raportare bug (severity/priority/description + tested commit)
   - MP: assign to me (un singur MP) + resolve cu resolved commit
   - serviciu extern: repo info (GitHub) */

export default function ProjectDetails() {
  const { id } = useParams();
  const projectId = id;

  const navigate = useNavigate();

  // Ne ajuta sa stim daca bug-ul asignat este asignat la mine 
  const me = useMemo(() => getCurrentUserFromToken(), []);
  const myId = me?.id;

  const [project, setProject] = useState(null);
  const [role, setRole] = useState(null); // "MP" | "TST" | null

  const [bugs, setBugs] = useState([]);
  const [repoInfo, setRepoInfo] = useState(null);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Form: raportare bug
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [priority, setPriority] = useState("medium");
  const [reportedCommit, setReportedCommit] = useState("");

  // Form: edit proiect (MP)
  const [editName, setEditName] = useState("");
  const [editRepo, setEditRepo] = useState("");

  // Form: adauga tester (MP)
  const [testerEmail, setTesterEmail] = useState("");

  // Input per bug pentru resolve commit
  const [resolveCommit, setResolveCommit] = useState({});

  const loadProjectAndRole = async () => {
    // Strategie:
    // 1) incercam in My Projects ca sa luam rolul (daca suntem membri)
    // 2) daca nu suntem membri, luam proiectul din All Projects
    const mine = await getMyProjects();
    const foundMine = mine.find((p) => String(p.id) === String(projectId));

    if (foundMine) {
      setProject(foundMine);
      setRole(foundMine.role || null);
      setEditName(foundMine.name || "");
      setEditRepo(foundMine.repositoryUrl || "");
      return;
    }

    const all = await getAllProjects();
    const foundAll = all.find((p) => String(p.id) === String(projectId));
    if (!foundAll) throw new Error("Project not found");

    setProject(foundAll);
    setRole(foundAll.role || null);
    setEditName(foundAll.name || "");
    setEditRepo(foundAll.repositoryUrl || "");
  };

  const loadBugs = async (currentRole, currentProject) => {
    // Cerinta: bug list este relevanta doar pentru membri (TST/MP)
    if (!currentRole) {
      setBugs([]);
      return;
    }
    const data = await getBugsByProject(projectId);
    setBugs(data);

    // Cerinta template: serviciu extern (GitHub). Incercam sa afisam repo info
    if (currentProject?.repositoryUrl) {
      try {
        const ri = await getGithubRepoInfo(currentProject.repositoryUrl);
        setRepoInfo(ri);
      } catch {
        setRepoInfo(null);
      }
    }
  };

  const reload = async () => {
    setError("");
    setInfo("");
    try {
      await loadProjectAndRole();
    } catch (e) {
      setError(e?.message || "Could not load project");
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line
  }, [projectId]);

  useEffect(() => {
    // Cand se schimba rolul/proiectul, reincarcam bug-urile si repo info
    if (project) loadBugs(role, project);
    // eslint-disable-next-line
  }, [role, project]);

  const handleJoin = async () => {
    // Cerinta: student non-member se poate inscrie ca tester (TST)
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

  const handleReportBug = async (e) => {
    // Cerinta: TST raporteaza bug cu severity/priority/description + tested commit
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      await createBug({
        projectId: Number(projectId),
        title,
        description,
        severity,
        priority,
        reportedCommit,
      });

      setTitle("");
      setDescription("");
      setSeverity("medium");
      setPriority("medium");
      setReportedCommit("");

      setInfo("Bug reported");
      await loadBugs(role, project);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Could not report bug");
    }
  };

  const handleAssignToMe = async (bugId) => {
    // Cerinta: MP aloca rezolvarea catre el insusi (un singur MP per bug)
    setError("");
    setInfo("");

    try {
      await assignBugToMe(bugId);
      setInfo("Assigned");
      await loadBugs(role, project);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not assign bug");
    }
  };

  const handleResolve = async (bugId) => {
    // Cerinta: MP rezolva bug si ataseaza commit-ul rezolvarii
    setError("");
    setInfo("");

    const commit = resolveCommit[bugId];
    if (!commit) {
      setError("Please enter resolved commit");
      return;
    }

    try {
      await resolveBug(bugId, { resolvedCommit: commit });
      setInfo("Resolved");
      await loadBugs(role, project);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not resolve bug");
    }
  };

  const handleAddTester = async (e) => {
  e.preventDefault();
  setError("");
  setInfo("");

  try {
    await addTesterToProject(projectId, testerEmail);
    setTesterEmail("");
    setInfo("Tester added");
  } catch (err) {
    setError(err?.response?.data?.message || "Could not add tester");
  }
};

  const handleUpdateProject = async (e) => {
    // Cerinta: MP poate modifica proiectul (ex: name, repositoryUrl)
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      await updateProject(projectId, { name: editName, repositoryUrl: editRepo });
      setInfo("Project updated");
      await reload();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Could not update project");
    }
  };

  if (!project) {
    return (
      <div className="container">
        <button className="secondary" onClick={() => navigate("/dashboard")}>
        Back
        </button>
        {error ? <p className="msg-error">{error}</p> : <p className="muted">Loading...</p>}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <button className="secondary" onClick={() => navigate("/dashboard")}>
         Back
        </button>
        <span className="badge">{me?.email || "user"}</span>
      </div>

      <h2 style={{ marginBottom: 6 }}>{project.name}</h2>
      <div className="muted">{project.repositoryUrl}</div>
      <div style={{ marginTop: 8 }}>
        Role: <span className="badge">{role || "non-member"}</span>
      </div>

      {error && <p className="msg-error">{error}</p>}
      {info && <p className="msg-success">{info}</p>}

      {/* Non-member -> Join as Tester */}
      {!role && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Join project</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            You are not a member of this project. Click the button below to join as tester.
          </p>
          <button onClick={handleJoin}>Join as Tester</button>
        </div>
      )}

      {/* Repo info (serviciu extern) */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Repository info (GitHub)</h3>
        {repoInfo ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <b>
                {repoInfo.full_name || `${repoInfo.owner}/${repoInfo.repo}`}
              </b>
            </li>

            <li>Stars: {repoInfo.stargazers_count ?? repoInfo.stars}</li>
            <li>Forks: {repoInfo.forks_count ?? repoInfo.forks}</li>
            <li>Open issues: {repoInfo.open_issues_count ?? repoInfo.openIssues}</li>

            {repoInfo.updated_at && <li>Updated at: {repoInfo.updated_at}</li>}

            {repoInfo.lastCommit && (
              <li>
                Last commit: <b>{String(repoInfo.lastCommit.sha).slice(0, 7)}</b>{" "}
                – {repoInfo.lastCommit.message}
              </li>
            )}
          </ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No repository info available.
          </p>
        )}
      </div>

      {/* MP -> edit project */}
      {role === "MP" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Edit project (MP)</h3>
          <form className="stack" onSubmit={handleUpdateProject}>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Project name" />
            <input value={editRepo} onChange={(e) => setEditRepo(e.target.value)} placeholder="Repository URL" />
            <button>Save</button>
          </form>
        </div>
      )}

      {/* MP -> add tester */}
      {role === "MP" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Add tester (MP)</h3>
          <form className="stack" onSubmit={handleAddTester}>
            <input value={testerEmail} onChange={(e) => setTesterEmail(e.target.value)} placeholder="tester@email.com" />
            <button>Add tester</button>
            <p className="muted" style={{ margin: 0 }}>
              Note: Only MP can add testers to the project.
            </p>
          </form>
        </div>
      )}


      {/* Membri (TST/MP) -> Bug list; DOAR TST -> Report bug */} 
      {role && (
        <>
        {/* Report bug - DOAR TST */}
        {role === "TST" && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Report bug</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Report a bug with the form below.
            </p>

            <form className="stack" onSubmit={handleReportBug}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />

              <div className="grid-2">
                <label className="label">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>

                <label className="label">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>

              <input
                value={reportedCommit}
                onChange={(e) => setReportedCommit(e.target.value)}
                placeholder="Tested commit (hash or link)"
              />

              <button>Submit</button>
            </form>
          </div>
        )}

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Bug list</h3>

            {bugs.length === 0 ? (
              <p className="muted">No bugs yet.</p>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {bugs.map((b) => {
                  const assignedToMe =
                    myId && b.assignedToUserId && Number(b.assignedToUserId) === Number(myId);

                  return (
                    <li key={b.id} style={{ marginBottom: 14 }}>
                      <div className="row">
                        <div>
                          <b>{b.title}</b>{" "}
                          <span className="badge">{b.status || "open"}</span>
                        </div>

                        <div className="muted" style={{ fontSize: 12 }}>
                          severity: <b>{b.severity}</b> | priority: <b>{b.priority}</b>
                        </div>
                      </div>

                      <div style={{ marginTop: 6 }}>{b.description}</div>

                      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                        reportedCommit: <b>{b.reportedCommit}</b>
                      </div>

                      {b.resolvedCommit && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          resolvedCommit: <b>{b.resolvedCommit}</b>
                        </div>
                      )}

                      <div className="hr" />

                      {/* Actiuni MP */}
                      {role === "MP" && (
                        <div className="stack">
                          <div className="row">
                            <button
                              onClick={() => handleAssignToMe(b.id)}
                              disabled={!!b.assignedToUserId || b.status === "resolved"}
                              title={b.assignedToUserId ? "Already assigned" : ""}
                            >
                              Assign to me
                            </button>

                            <span className="muted" style={{ fontSize: 12 }}>
                              assignedToUserId: <b>{b.assignedToUserId || "-"}</b>
                            </span>
                          </div>

                          {/* Resolve doar daca bug-ul e asignat la mine (UI corect) */}
                          {b.status !== "resolved" && assignedToMe && (
                            <div className="row" style={{ alignItems: "stretch" }}>
                              <input
                                value={resolveCommit[b.id] || ""}
                                onChange={(e) =>
                                  setResolveCommit((prev) => ({ ...prev, [b.id]: e.target.value }))
                                }
                                placeholder="Resolved commit"
                              />
                              <button onClick={() => handleResolve(b.id)}>Resolve</button>
                            </div>
                          )}

                          {b.assignedToUserId && !assignedToMe && b.status !== "resolved" && (
                            <div className="muted" style={{ fontSize: 12 }}>
                              Bug assigned to another MP.
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
