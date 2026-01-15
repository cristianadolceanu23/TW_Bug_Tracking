const { DataTypes } = require("sequelize")
const sequelize = require("../database")

const Bug = sequelize.define("Bug", {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM("low", "medium", "high"),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high"),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("open", "assigned", "resolved"),
    defaultValue: "open"
  },
  reportedCommit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resolvedCommit: {
    type: DataTypes.STRING,
    allowNull: true
  },

   reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  assignedToUserId: {
  type: DataTypes.INTEGER,
  allowNull: true
}

})

module.exports = Bug
