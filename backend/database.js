const { Sequelize } = require("sequelize")
require("dotenv").config()

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.SQLITE_PATH,
  logging: false
})

module.exports = sequelize
