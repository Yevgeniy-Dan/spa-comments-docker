const axios = require("axios");
const FormData = require("form-data");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const { isCorrectHtmlTags } = require("../validators/html-tags");
const DOMPurify = require("isomorphic-dompurify");

const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");
const io = require("../socket");
const CommentTree = require("../utils/comment-tree/comment-tree");

exports.getComments = asyncHandler(async (req, res) => {
  const currentPage = req.query.page || 1;
  const sortBy = req.query.sortBy || "date";
  const sortOrder = req.query.sortOrder || "desc";
  const perPage = 25;

  const commentTree = new CommentTree();

  const comments = await Comment.findAll();
  const replies = await ReplyTo.findAll();

  for (let r of replies) {
    commentTree.addReplyIdObj(r.commentId, r.replyId);
  }

  for (let c of comments) {
    commentTree.addComment(c.dataValues);
  }

  for (let r of replies) {
    commentTree.addEdge(r.commentId, r.replyId);
  }

  const skippedItems = (currentPage - 1) * perPage;
  const result = commentTree
    .sort(sortBy, sortOrder)
    .slice(skippedItems, perPage);

  io.getIO().emit("comments", {
    action: "getComments",
    comments: result,
    totalItems: result.length,
  });

  res.status(200).json({
    message: "Success",
    comments: result,
    totalItems: result.length,
  });
});

exports.postComment = asyncHandler(async (req, res) => {
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
  const { userName, email, homePage, uploadUrl, text, captchaToken } = req.body;

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

    await ReplyTo.create({
      replyId: newComment.id,
      commentId: parentId,
    });

    const { updatedAt, commentId, ...rest } = newComment.dataValues;

    // io.getIO().emit("comments", {
    //   action: "create",
    //   reply: {
    //     replyId: newComment.id,
    //     commentId: parentUser.id,
    //     replyToUsername: parentUser.userName,
    //     ...rest,
    //   },
    // });
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
  }

  // io.getIO().emit("comments", {
  //   action: "create",
  //   comment: newComment,
  // });
  return res.status(201).json({
    message: "Comment created successfully!",
    comment: newComment,
  });
});
