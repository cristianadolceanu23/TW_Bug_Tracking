const jwt = require("jsonwebtoken")

function auth(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" })
  }

  const token = header.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret")
    req.user = decoded // {id, email}
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }
}

module.exports = auth
