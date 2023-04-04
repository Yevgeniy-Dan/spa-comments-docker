const Sequelize = require("sequelize");

const sequelize = require("../utils/database");

const Comment = sequelize.define("comment", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    // unique: true,
  },
  homePage: Sequelize.STRING,
  uploadUrl: Sequelize.STRING,
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

module.exports = Comment;
