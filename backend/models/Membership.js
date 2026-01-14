const { DataTypes } = require("sequelize")
const sequelize = require("../database")

const Membership = sequelize.define("Membership", {
  role: {
    type: DataTypes.ENUM("MP", "TST"),
    allowNull: false
  }
})

module.exports = Membership
