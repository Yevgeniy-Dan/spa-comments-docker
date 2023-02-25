const Sequelize = require("sequelize");

const sequelize = require("../util/database");
const Comment = require("./comment");

const ReplyTo = sequelize.define("replyTo", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = ReplyTo;
