const axios = require("axios");
const FormData = require("form-data");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const { isCorrectHtmlTags } = require("../validators/html-tags");
const DOMPurify = require("isomorphic-dompurify");

const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");
const io = require("../socket");

const commentTree = require("../utils/comment-tree/comment-tree");
let sortedComments;
const perPage = 25;

// We create an object with properties. The setSortedComments function is used to set the app.locals.sortedComments value to the sortedComments variable

// These functions are exported as modules, so we can import them into a file where we define our routes.

module.exports = {
  // This function needs to be called once when starting the server (see app.js)
  setSortedComments: (initialSortedComments) => {
    sortedComments = initialSortedComments;
  },

  getComments: asyncHandler(async (req, res) => {
    const currentPage = req.query.page || 1;
    const sortOrder = req.query.sortOrder || "desc";
    const sortBy = req.query.sortBy || "date";

    sortedComments = commentTree.sort(sortBy, sortOrder);

    const skippedComments = (currentPage - 1) * perPage;
    const paginatedComments = sortedComments.slice(skippedComments, perPage);

    const total = sortedComments.length;

    io.getIO().emit("comments", {
      action: "getComments",
      comments: paginatedComments,
      totalItems: sortedComments.length,
    });

    res.status(200).json({
      message: "Success",
      comments: paginatedComments,
      totalItems: total,
    });
  }),

  addPreview: asyncHandler(async (req, res) => {
    const previewComment = req.query.previewComment;
    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder || "desc";

    if (!previewComment) {
      return res.status(404).json({
        message: "You are not passed the 'previewComment' within 'query'",
      });
    }

    commentTree.addReplyIdObj(previewComment.parentId, previewComment.id);
    commentTree.addComment(previewComment);
    commentTree.addEdge(previewComment.parentId, previewComment.id);
    const sortedComments = commentTree.sort(sortBy, sortOrder);

    const previewIndex = sortedComments.findIndex(
      (c) => c.id === previewComment.id
    );

    const currentPage = Math.ceil(previewIndex / perPage);

    const total = sortedComments.length;

    const skippedItems = (currentPage - 1) * perPage;

    const paginatedComments = sortedComments.slice(skippedItems, perPage);

    res.status(200).json({
      message: "Success",
      comments: paginatedComments,
      page: currentPage,
      totalItems: total,
    });
  }),
  removePreview: asyncHandler(async (req, res) => {
    const previewId = req.query.id;
    const currentPage = req.query.page || 1;

    if (!previewId) {
      return res.status(404).json({
        message: "You didn't provide a 'preview comment' id",
      });
    }

    sortedComments = sortedComments.filter((c) => c.id !== previewId);

    // Also delete previewComment node from data structure
    commentTree.removeComment(previewId);
    const total = sortedComments.length;

    const skippedItems = (currentPage - 1) * perPage;

    const paginatedComments = sortedComments.slice(skippedItems, perPage);

    res.status(200).json({
      message: "Success",
      comments: paginatedComments,
      totalItems: total,
    });
  }),
  postComment: asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg);
      error.data = errors.array();
      error.statusCode = 422;
      throw error;
    }
    const isTagSuccess = await isCorrectHtmlTags(req.body.text);

    if (!isTagSuccess) {
      const error = new Error(
        "Validation failed, entered text message has incorrect tags"
      );
      error.statusCode = 422;
      throw error;
    }

    const parentId = req.params.parentId;
    const { userName, email, homePage, uploadUrl, text, captchaToken } =
      req.body;

    // Captcha verify

    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },
      }
    );

    if (!recaptchaResponse.data.success) {
      const error = new Error("The reCaptcha is invalid");
      error.statusCode = 422;
      throw error;
    }

    const sanitazedText = DOMPurify.sanitize(text);
    const comment = new Comment({
      userName,
      email,
      homePage,
      uploadUrl,
      text: sanitazedText,
    });

    let newComment;

    if (parentId) {
      const parentUser = await Comment.findByPk(parentId);

      if (!parentUser) {
        const error = new Error(
          "The user you want to reply to does not exist already"
        );
        error.statusCode = 422;
        throw error;
      }

      newComment = await comment.save();

      commentTree.addReplyIdObj(parentId, newComment.id);
      commentTree.addComment(newComment);
      commentTree.addEdge(parentId, newComment.id);

      await ReplyTo.create({
        replyId: newComment.id,
        commentId: parentId,
      });

      const { updatedAt, commentId, ...rest } = newComment.dataValues;

      return res.status(201).json({
        message: "Reply comment created successfully!",
        reply: {
          replyId: newComment.id,
          commentId: parentUser.id,
          replyToUsername: parentUser.userName,
          ...rest,
        },
      });
    } else {
      newComment = await comment.save();
      commentTree.addComment(newComment);
    }

    return res.status(201).json({
      message: "Comment created successfully!",
      comment: newComment,
    });
  }),
};

module.exports.sortedComments = sortedComments;
