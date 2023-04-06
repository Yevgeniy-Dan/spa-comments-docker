const axios = require("axios");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const { isCorrectHtmlTags } = require("../validators/html-tags");
const DOMPurify = require("isomorphic-dompurify");

const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");
const io = require("../socket");

const commentTree = require("../utils/comment-tree/comment-tree");
const perPage = 25;

// These functions are exported as modules, so we can import
// them into a file where we define our routes.

function getPageForAddedComment(addedComment, sortBy, sortOrder) {
  const updatedSortedComments = commentTree.sort(sortBy, sortOrder);

  const addedCommentIndex = updatedSortedComments.findIndex(
    (c) => c.id === addedComment.id
  );

  const page = Math.ceil(addedCommentIndex / perPage);

  return { page, total: updatedSortedComments.length };
}

module.exports = {
  getComments: asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const sortOrder = req.query.sortOrder || "desc";
    const sortBy = req.query.sortBy || "date";

    const updatedSortedComments = commentTree.sort(sortBy, sortOrder);

    const skippedComments = (page - 1) * perPage;
    const paginatedComments = updatedSortedComments.slice(
      skippedComments,
      perPage * page
    );

    const total = updatedSortedComments.length;

    // io.getIO().emit("comments", {
    //   action: "getComments",
    //   comments: paginatedComments,
    //   totalItems: total,
    // });

    res.status(200).json({
      message: "Success",
      comments: paginatedComments,
      totalItems: total,
    });
  }),

  // addPreview: asyncHandler(async (req, res) => {
  //   const previewComment = req.query.previewComment;
  //   const sortBy = req.query.sortBy || "date";
  //   const sortOrder = req.query.sortOrder || "desc";

  //   if (!previewComment) {
  //     return res.status(404).json({
  //       message: "You are not passed the 'previewComment' within 'query'",
  //     });
  //   }

  //   commentTree.addReplyIdObj(previewComment.parentId, previewComment.id);
  //   commentTree.addComment(previewComment);
  //   commentTree.addEdge(previewComment.parentId, previewComment.id);
  //   const updatedSortedComments = commentTree.sort(sortBy, sortOrder);

  //   const previewIndex = updatedSortedComments.findIndex(
  //     (c) => c.id === previewComment.id
  //   );

  //   const page = Math.ceil(previewIndex / perPage);

  //   const total = updatedSortedComments.length;

  //   const skippedItems = (page - 1) * perPage;

  //   const paginatedComments = updatedSortedComments.slice(
  //     skippedItems,
  //     perPage
  //   );

  //   res.status(200).json({
  //     message: "Success",
  //     comments: paginatedComments,
  //     page: page,
  //     totalItems: total,
  //   });
  // }),
  // removePreview: asyncHandler(async (req, res) => {
  //   const previewId = req.query.id;
  //   const page = req.query.page || 1;

  //   if (!previewId) {
  //     return res.status(404).json({
  //       message: "You didn't provide a 'preview comment' id",
  //     });
  //   }

  //   // const updatedSortedComments = sortedComments.filter(
  //   //   (c) => c.id !== previewId
  //   // );

  //   // Also delete previewComment node from data structure
  //   commentTree.removeComment(previewId);
  //   const updatedSortedComments = commentTree.sort();
  //   const total = updatedSortedComments.length;

  //   const skippedItems = (page - 1) * perPage;

  //   const paginatedComments = updatedSortedComments.slice(
  //     skippedItems,
  //     perPage
  //   );

  //   res.status(200).json({
  //     message: "Success",
  //     comments: paginatedComments,
  //     totalItems: total,
  //   });
  // }),
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
    const { sortBy, sortOrder } = req.query;

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

    // const { page, total } = getPageForAddedComment(
    //   newComment.dataValues,
    //   sortBy,
    //   sortOrder
    // );

    io.getIO().emit("comments", {
      action: "addComment",
      // page: page,
      comment: newComment.dataValues,
      // totalItems: total,
    });

    return res.status(201).json({
      message: "Comment created successfully!",
      comment: newComment.dataValues,
    });
  }),
};
