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

    const bug = await Bug.create({
      title,
      description,
      severity,
      priority,
      reportedCommit,
      ProjectId: projectId,
      UserId: req.user.id
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
      include: [{ model: User, attributes: ["id", "email"] }]
    })

    return res.json(bugs)
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// PATCH /bugs/:id/resolve (doar MP poate marca rezolvat)
router.patch("/:id/resolve", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { resolvedCommit } = req.body

    if (!resolvedCommit) {
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

    bug.status = "resolved"
    bug.resolvedCommit = resolvedCommit
    await bug.save()

    return res.json({ message: "Bug resolved ✅", bug })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

module.exports = router
