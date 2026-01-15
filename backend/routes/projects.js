const router = require("express").Router()
const auth = require("../middleware/authMiddleware")

const User = require("../models/User")
const Project = require("../models/Project")
const Membership = require("../models/Membership")

// POST /projects  (creează proiect și îl face pe creator MP)
router.post("/", auth, async (req, res) => {
  try {
    const { name, repositoryUrl } = req.body

    if (!name || !repositoryUrl) {
      return res.status(400).json({ message: "name and repositoryUrl are required" })
    }
    // Validare GitHub repo
    
    const repo = repositoryUrl.trim();
  if (!repo.startsWith("https://github.com/")) {
    return res.status(400).json({ message: "Repository URL must start with https://github.com/" });
  }
    const project = await Project.create({ name: name.trim(), repositoryUrl: repo})

    await Membership.create({
      UserId: req.user.id,
      ProjectId: project.id,
      role: "MP"
    })

    return res.status(201).json(project)
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// GET /projects  (proiectele userului curent)
router.get("/", auth, async (req, res) => {
  try {
    const memberships = await Membership.findAll({
      where: { UserId: req.user.id },
      include: [Project]
    })

    const projects = memberships.map(m => ({
      id: m.Project.id,
      name: m.Project.name,
      repositoryUrl: m.Project.repositoryUrl,
      role: m.role
    }))

    return res.json(projects)
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// GET /projects/all
// Cerinta: student non-member poate vedea toate proiectele
// Returnam toate proiectele + rolul user-ului curent (MP/TST) daca este membru, altfel null
router.get("/all", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.findAll();
    const memberships = await Membership.findAll({ where: { UserId: userId } });

    // ProjectId -> role
    const roleByProjectId = {};
    memberships.forEach((m) => {
      roleByProjectId[m.ProjectId] = m.role;
    });

    const result = projects.map((p) => ({
      id: p.id,
      name: p.name,
      repositoryUrl: p.repositoryUrl,
      role: roleByProjectId[p.id] || null
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});


// POST /projects/:projectId/testers  (MP adaugă tester)
router.post("/:projectId/testers", auth, async (req, res) => {
  try {
    const { projectId } = req.params
    const { testerEmail } = req.body

    if (!testerEmail) {
      return res.status(400).json({ message: "testerEmail is required" })
    }

    // verifică dacă userul curent este MP pe proiect
    const mp = await Membership.findOne({
      where: { UserId: req.user.id, ProjectId: projectId, role: "MP" }
    })
    if (!mp) {
      return res.status(403).json({ message: "Only MP can add testers" })
    }

    const tester = await User.findOne({ where: { email: testerEmail } })
    if (!tester) {
      return res.status(404).json({ message: "Tester not found" })
    }

    // evităm dubluri
    const exists = await Membership.findOne({
      where: { UserId: tester.id, ProjectId: projectId }
    })
    if (exists) {
      return res.status(409).json({ message: "User already in project" })
    }

    await Membership.create({
      UserId: tester.id,
      ProjectId: projectId,
      role: "TST"
    })

    return res.status(201).json({ message: "Tester added " })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// POST /projects/:projectId/join (user se alătură proiectului ca TST)
router.post("/:projectId/join", auth, async (req, res) => {
  try {
    const { projectId } = req.params

    // verificăm că proiectul există
    const project = await Project.findByPk(projectId)
    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // verificăm dacă userul e deja membru
    const existing = await Membership.findOne({
      where: { UserId: req.user.id, ProjectId: projectId }
    })

    if (existing) {
      return res.status(409).json({ message: "Already a member of this project" })
    }

    // dacă nu e membru, îl adăugăm ca TST
    const membership = await Membership.create({
      UserId: req.user.id,
      ProjectId: projectId,
      role: "TST"
    })

    return res.status(201).json({ message: "Joined project ", membership })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// PATCH /projects/:projectId  (MP-only) -> update name, repositoryUrl
router.patch("/:projectId", auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, repositoryUrl } = req.body;

    if (name === undefined && repositoryUrl === undefined) {
      return res.status(400).json({ message: "Nothing to update" })
    }

    // 1) verificăm că userul curent este MP pe proiect
    const mp = await Membership.findOne({
      where: { UserId: req.user.id, ProjectId: projectId, role: "MP" }
    });

    if (!mp) {
      return res.status(403).json({ message: "Only MP can update project" });
    }

    // 2) verificăm că proiectul există
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 3) update doar câmpurile primite
    if (typeof name === "string" && name.trim().length > 0) {
      project.name = name.trim();
    }

    if (typeof repositoryUrl === "string" && repositoryUrl.trim().length > 0) {
      const repo = repositoryUrl.trim();
      if (!repo.startsWith("https://github.com/")) {
        return res.status(400).json({ message: "Repository URL must start with https://github.com/" });
      }
      project.repositoryUrl = repo;
    }


    await project.save();

    return res.json({ message: "Project updated ", project });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});


module.exports = router
