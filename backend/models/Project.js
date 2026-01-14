const { DataTypes } = require("sequelize")
const sequelize = require("../database")

const Project = sequelize.define("Project", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  repositoryUrl: {
    type: DataTypes.STRING,
    allowNull: false
  }
})

module.exports = Project
