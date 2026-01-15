const router = require("express").Router()
const auth = require("../middleware/authMiddleware")

const Bug = require("../models/Bug")
const Membership = require("../models/Membership")
const Project = require("../models/Project")
const User = require("../models/User")


// POST /bugs (TST raportează bug într-un proiect)
router.post("/", auth, async (req, res) => {
  try {
    const { projectId, title, description, severity, priority, reportedCommit } = req.body

    if (!projectId || !title || !description || !severity || !priority || !reportedCommit) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // userul trebuie să fie membru în proiect (TST sau MP)
    const membership = await Membership.findOne({
      where: { UserId: req.user.id, ProjectId: projectId }
    })

    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this project" })
    }

    // DOAR TST poate raporta bug (MP NU raportează)
    if (membership.role !== "TST") {
      return res.status(403).json({ message: "Only testers (TST) can report bugs" })
    }


    const bug = await Bug.create({
  title,
  description,
  severity,
  priority,
  reportedCommit,
  ProjectId: projectId,
  reporterId: req.user.id
})



    return res.status(201).json(bug)
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// GET /bugs/project/:projectId (lista bug-urilor pe proiect) - MP sau TST membru
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const { projectId } = req.params

    const membership = await Membership.findOne({
      where: { UserId: req.user.id, ProjectId: projectId }
    })

    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this project" })
    }

    const bugs = await Bug.findAll({
      where: { ProjectId: projectId },
      include: [
  { model: User, as: "Reporter", attributes: ["id", "email"] },
  { model: User, as: "Assignee", attributes: ["id", "email"] }
]
    })

    return res.json(bugs)
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// PATCH /bugs/:id/resolve (doar MP-ul asignat poate marca rezolvat)
router.patch("/:id/resolve", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { resolvedCommit } = req.body

    if (!resolvedCommit || resolvedCommit.trim().length === 0) {
      return res.status(400).json({ message: "resolvedCommit is required" })
    }

    const bug = await Bug.findByPk(id)
    if (!bug) {
      return res.status(404).json({ message: "Bug not found" })
    }

    // doar MP pe proiectul bug-ului
    const mp = await Membership.findOne({
      where: { UserId: req.user.id, ProjectId: bug.ProjectId, role: "MP" }
    })
    if (!mp) {
      return res.status(403).json({ message: "Only MP can resolve bugs" })
    }

    // REGULI pentru grilă: trebuie să fie asignat și doar MP-ul asignat îl poate rezolva
    if (bug.status !== "assigned") {
      return res.status(409).json({ message: "Bug must be assigned before it can be resolved" })
    }

    if (!bug.assignedToUserId) {
      return res.status(409).json({ message: "Bug is not assigned to anyone" })
    }

    if (bug.assignedToUserId !== req.user.id) {
      return res.status(403).json({ message: "Only the assigned MP can resolve this bug" })
    }

    bug.status = "resolved"
    bug.resolvedCommit = resolvedCommit.trim()
    await bug.save()

    return res.json({ message: "Bug resolved", bug })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})


// PATCH /bugs/:id/assign (MP-only)
// -> setează assignedToUserId = req.user.id și status="assigned"
router.patch("/:id/assign", auth, async (req, res) => {
  try {
    const { id } = req.params

    const bug = await Bug.findByPk(id)
    if (!bug) {
      return res.status(404).json({ message: "Bug not found" })
    }

    // verificăm că userul curent este MP pe proiectul bugului
    const mp = await Membership.findOne({
      where: {
        UserId: req.user.id,
        ProjectId: bug.ProjectId,
        role: "MP"
      }
    })

    if (!mp) {
      return res.status(403).json({ message: "Only MP can assign bugs" })
    }

    //  refuz dacă deja assigned sau resolved (varianta simplă)
    if (bug.status !== "open" || bug.assignedToUserId) {
      return res.status(409).json({ message: "Bug is already assigned or resolved" })
    }

    bug.assignedToUserId = req.user.id
    bug.status = "assigned"
    await bug.save()

    return res.json({ message: "Bug assigned ", bug })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// GET /bugs  (toate bug-urile din proiectele unde userul e membru)
router.get("/", auth, async (req, res) => {
  try {
    // 1) aflăm proiectele unde userul e membru
    const memberships = await Membership.findAll({
      where: { UserId: req.user.id }
    });

    const projectIds = memberships.map(m => m.ProjectId);

    // dacă nu e în niciun proiect
    if (projectIds.length === 0) {
      return res.json([]);
    }

    // 2) luăm bug-urile din acele proiecte
    const bugs = await Bug.findAll({
      where: { ProjectId: projectIds }
    });

    return res.json(bugs);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});


module.exports = router
