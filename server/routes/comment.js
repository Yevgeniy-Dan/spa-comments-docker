const express = require("express");
const { body } = require("express-validator");

const commentController = require("../controllers/comment");

const { checkSortedComments } = require("../middleware");

const router = express.Router();

router.get("/", checkSortedComments, commentController.getComments);

router.post(
  "/add-comment",
  checkSortedComments,
  [
    body("userName").trim().not().isEmpty(),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body("text").trim().not().isEmpty(),
  ],
  commentController.postComment
);

router.post(
  "/add-comment/:parentId",
  checkSortedComments,
  [
    body("userName").trim().not().isEmpty(),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body("text").trim().not().isEmpty(),
  ],
  commentController.postComment
);

module.exports = router;
