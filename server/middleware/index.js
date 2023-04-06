const { sortedComments } = require("../controllers/comment");

const checkSortedComments = (req, res, next) => {
  if (!sortedComments) {
    return res.status(503).json({
      message: "Server is not yet ready. Please try again later.",
    });
  }
  next();
};

module.exports = {
  checkSortedComments,
};
