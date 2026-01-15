const express = require("express")
require("dotenv").config()

const sequelize = require("./database")
const User = require("./models/User")
const Project = require("./models/Project")
const Membership = require("./models/Membership")
const Bug = require("./models/Bug")
const authRoutes = require("./routes/auth")
const projectRoutes = require("./routes/projects")
const bugRoutes = require("./routes/bugs")
const externalRoutes = require("./routes/external");



const app = express()
const PORT = process.env.PORT || 3000
const cors = require("cors");


app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options(/.*/, cors());

app.use(express.json())
app.use("/auth", authRoutes)
app.use("/projects", projectRoutes)
app.use("/bugs", bugRoutes)
app.use("/external", externalRoutes);



sequelize.authenticate()
  .then(() => {
    console.log("SQLite connected ")
  })
  .catch((err) => {
    console.error("SQLite connection error ", err)
  })

User.belongsToMany(Project, { through: Membership })
Project.belongsToMany(User, { through: Membership })

Membership.belongsTo(User)
Membership.belongsTo(Project)
User.hasMany(Membership)
Project.hasMany(Membership)

Project.hasMany(Bug)
Bug.belongsTo(Project)

// BUG -> USER de 2 ori: Reporter și Assignee
User.hasMany(Bug, { as: "ReportedBugs", foreignKey: "reporterId" })
Bug.belongsTo(User, { as: "Reporter", foreignKey: "reporterId" })

User.hasMany(Bug, { as: "AssignedBugs", foreignKey: "assignedToUserId" })
Bug.belongsTo(User, { as: "Assignee", foreignKey: "assignedToUserId" })


  sequelize.sync()
  .then(() => {
    console.log("Database synced ")
  })
  .catch((err) => {
    console.error("Sync error ", err)
  })


app.get("/", (req, res) => {
  res.send("Backend + SQLite are running ")
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
