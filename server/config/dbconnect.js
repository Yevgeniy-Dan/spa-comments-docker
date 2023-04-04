const sequelize = require("../utils/database");

const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    Comment.hasMany(ReplyTo);
    ReplyTo.belongsTo(Comment, {
      as: "parent",
      foreignKey: {
        name: "commentId",
        allowNull: false,
      },
    });
    ReplyTo.belongsTo(Comment, {
      as: "reply",
      foreignKey: {
        name: "replyId",
        allowNull: false,
      },
    });
    await Comment.sync();
    await ReplyTo.sync();
  } catch (error) {
    console.error(
      "This error is in the dbconnect file. Unable to connect to the database:",
      error
    );
    process.exit(1);
  }
};

module.exports = connectDB;
