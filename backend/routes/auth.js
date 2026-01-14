const router = require("express").Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../models/User")

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: "Email already exists" })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ email, password: hashed })

    return res.status(201).json({ id: user.id, email: user.email })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // token simplu pentru proiect
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    )

    return res.json({ token })
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) })
  }
})

module.exports = router
