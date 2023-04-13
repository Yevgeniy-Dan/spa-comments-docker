const axios = require("axios");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const { isCorrectHtmlTags } = require("../validators/html-tags");
const DOMPurify = require("isomorphic-dompurify");

const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");
const io = require("../socket");

const commentTree = require("../utils/comment-tree/comment-tree");
const PER_PAGE = 25;

const userPreviews = {};

// These functions are exported as modules, so we can import
// them into a file where we define our routes.

const getCommentsWithPreview = (query) => {
  const sortOrder = query.sortOrder || "desc";
  const sortBy = query.sortBy || "date";
  const previewId = query.previewId || null;

  let updatedSortedComments;
  let page;

  if (previewId && previewId in userPreviews) {
    updatedSortedComments = commentTree.sort(
      sortBy,
      sortOrder,
      userPreviews[previewId].comment
    );

    const previewIndex = updatedSortedComments.findIndex(
      (c) => c.id === previewId
    );

    if (userPreviews[previewId].isNew) {
      page = Math.max(Math.ceil(previewIndex / PER_PAGE), 1);
    }

    userPreviews[previewId] = { ...userPreviews[previewId], isNew: false };
  } else {
    updatedSortedComments = commentTree.sort(sortBy, sortOrder);
  }

  return { updatedSortedComments, page };
};

module.exports = {
  getComments: asyncHandler(async (req, res) => {
    const previewId = req.query.previewId || null;

    let page = req.query.page || 1;

    let { updatedSortedComments, page: updatedPage } = getCommentsWithPreview(
      req.query
    );

    if (updatedPage) page = updatedPage;

    const skippedComments = (page - 1) * PER_PAGE;
    const paginatedComments = updatedSortedComments.slice(
      skippedComments,
      PER_PAGE * page
    );

    const total = updatedSortedComments.length;

    if (previewId && userPreviews[previewId]?.isNew) {
      io.getIO().emit("comments", {
        action: "getComments",
        page: page,
      });
    }

    res.status(200).json({
      message: "Success",
      comments: paginatedComments,
      totalItems: total,
    });
  }),

  addPreviewComment: asyncHandler(async (req, res) => {
    const previewComment = req.body;

    if (!previewComment) {
      return res.status(404).json({
        message: "You are not passed the 'previewComment' within 'query'",
      });
    }

    userPreviews[previewComment.id] = {
      comment: {
        ...previewComment,
        parentId: parseInt(previewComment.parentId, 10) || null,
        isPreview: true,
      },
      isNew: !userPreviews[previewComment.id],
    };

    io.getIO().emit("comments", {
      action: "addPreview",
      previewId: previewComment.id,
    });

    return res.status(200).json({
      message: "Success",
      previewId: previewComment.id,
    });
  }),
  deletePreview: asyncHandler(async (req, res) => {
    const previewId = req.query.previewId;

    if (!previewId) {
      io.getIO().emit("comments", {
        action: "deletePreviewComment",
        outdatedPreviewId: null,
      });

      return res.status(200).json({
        message: "Success. The previewId parameter turned out to be null.",
      });
    }

    if (previewId in userPreviews) {
      delete userPreviews[previewId];
    }

    io.getIO().emit("comments", {
      action: "deletePreviewComment",
      outdatedPreviewId: previewId,
    });

    res.status(200).json({
      message: "Preview comment successfully deleted.",
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

    const { userName, email, homePage, uploadUrl, text, captchaToken } =
      req.body;
    let parentId = req.query.parentId;

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

    if (parseInt(parentId)) {
      parentId = parseInt(parentId);
      const parentUser = await Comment.findByPk(parentId);

      if (!parentUser) {
        const error = new Error(
          "The user you want to reply to does not exist already"
        );
        error.statusCode = 422;
        throw error;
      }

      newComment = await comment.save();

      commentTree.addReplyIdObj(parentId, newComment.dataValues.id);
      commentTree.addComment(newComment.dataValues);
      commentTree.addEdge(parentId, newComment.dataValues.id);

      await ReplyTo.create({
        replyId: newComment.id,
        commentId: parentId,
      });
    } else {
      newComment = await comment.save();

      commentTree.addComment(newComment.dataValues);
    }

    io.getIO().emit("comments", {
      action: "addComment",
      comment: newComment.dataValues,
    });

    return res.status(201).json({
      message: "Comment created successfully!",
      comment: newComment.dataValues,
    });
  }),
};
