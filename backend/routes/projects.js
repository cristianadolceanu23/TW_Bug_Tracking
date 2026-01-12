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

    const project = await Project.create({ name, repositoryUrl })

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

    return res.status(201).json({ message: "Tester added ✅" })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

module.exports = router
