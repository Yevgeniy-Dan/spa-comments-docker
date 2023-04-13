const express = require("express");
const { body } = require("express-validator");

const commentController = require("../controllers/comment");

const router = express.Router();

router.get("/", commentController.getComments);

router.post(
  "/add-comment",
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
router.post("/add-preview-comment", commentController.addPreviewComment);
router.post("/delete-preview-comment", commentController.deletePreview);

module.exports = router;
