const axios = require("axios");
const FormData = require("form-data");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const { isCorrectHtmlTags } = require("../validators/html-tags");
const DOMPurify = require("isomorphic-dompurify");

const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");
const io = require("../socket");

exports.getComments = asyncHandler(async (req, res) => {
  const currentPage = req.query.page || 1;
  const sortBy = req.query.sortBy || "date";
  const sortOrder = req.query.sortOrder || "desc";
  const perPage = 25;

  let comments = await Comment.findAndCountAll();

  const allReplies = await ReplyTo.findAll({
    include: {
      model: Comment,
      as: "reply",
    },
  });

  //Only comments that are not replies
  comments.rows = comments.rows.filter((comment) => {
    return !allReplies.some((reply) => {
      return comment.id === reply.replyId;
    });
  });

  // Get replies in right format
  const formatReplies = allReplies.map((r) => {
    const { updatedAt, ...rest } = r.reply.dataValues;

    return {
      replyId: r.replyId,
      commentId: r.commentId,
      ...rest,
    };
  });

  // Adding new field topmost for defining if it root comment and not reply
  const rootComments = comments.rows.map((c) => {
    return {
      ...c.dataValues,
      topmost: true,
    };
  });

  // This two would have structure like that
  /*
    [
      [{id: 3}, {id:3}, {id: 3}], this array contain object with the same comment id
      [{}, {}, {}], and this one
      [{}, {}, {}]  and this one too
    ]
  */
  const rootReplies = [];
  const childReplies = [];

  // Function that will be executed recursively
  // The main function's assignment is sort replies
  // whether it reply of a root comment or a child
  const countComments = (allReplies, comment) => {
    const replies = allReplies.filter((reply) => {
      return comment.id === reply.commentId;
    });

    if (replies.length > 0) {
      const newReplies = replies.map((r) => {
        return {
          ...r,
          replyToUsername: comment.userName,
        };
      });
      if (comment.topmost) {
        rootReplies.push(newReplies);
      } else {
        childReplies.push(newReplies);
      }
      replies.map((replyComment) => {
        return countComments(allReplies, replyComment);
      });
    }
  };

  rootComments.map((c) => {
    return countComments(formatReplies, c);
  });

  // Get comments that doesn't have replies
  const rootWithoutChildren = rootComments.filter((rc) => {
    return !rootReplies.some((ur) => {
      ur.id === rc.id;
    });
  });

  // All comments in database
  let allComments = rootReplies
    .concat([rootWithoutChildren])
    .concat(childReplies)
    .flat();

  // This is variable that would save comment's ids of all replies
  const removedItems = [];

  // Assign root comments it's children
  childReplies.map((childArray /*this is array*/) => {
    const parentComment = allComments.filter(
      (ac) => ac.id === childArray[0].commentId
    )[0];

    removedItems.push(childArray[0].commentId);

    parentComment.nested = [...childArray];
  });

  //Put in root comments it's children
  allComments = allComments.map((c) => {
    if (c.topmost) {
      const children = allComments.filter((child) => child.commentId === c.id);
      if (children.length > 0) {
        c.nested = [...children];
        removedItems.push(c.id);
      }
    }
    return c;
  });

  // Save totalItems
  const totalItems = allComments.length;

  //Remove all children comments because it already in root's
  allComments = allComments.filter((comment) => {
    if (!comment.topmost) {
      return !removedItems.includes(comment.commentId);
    }
    return true;
  });

  // Sort root comments by createdAt, email or username depending on the request parameter

  switch (sortBy) {
    case "date":
      if (sortOrder === "desc") {
        allComments = allComments.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      } else {
        allComments = allComments.sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
      }
      break;
    case "email":
      if (sortOrder === "asc") {
        allComments = Array.from(allComments).sort((a, b) => {
          return a.email.localeCompare(b.email, "en", {
            sensitivity: "base",
          });
        });
      } else {
        allComments = Array.from(allComments).sort((a, b) => {
          return b.email.localeCompare(a.email, "en", { sensitivity: "base" });
        });
      }

      break;
    case "username":
      if (sortOrder === "asc") {
        allComments = Array.from(allComments).sort((a, b) => {
          return a.userName.localeCompare(b.userName, undefined, {
            sensitivity: "base",
          });
        });
      } else {
        allComments = Array.from(allComments).sort((a, b) => {
          return b.userName.localeCompare(a.userName, undefined, {
            sensitivity: "base",
          });
        });
      }

      break;
    default:
      allComments = allComments.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      break;
  }

  let count = 0;
  const skippedItems = (currentPage - 1) * perPage;
  let rootCommentsToReturn = [];
  let repliesToReturn = [];

  // The recursive function adds root comments and replies
  // to two corresponding arrays. They are linear
  // The function retrieves each next element in the comment tree
  // For example, an array has the following structure
  //[
  // {
  //     "id": 16,
  //     "nested": [
  //         {
  //             "id": 21,
  //         },
  //         {
  //             "id": 23,
  //             "nested": [
  //                 {
  //                     "id": 24,
  //                     "nested": [
  //                         {
  //                             "id": 25,
  //                         }
  //                     ]
  //                 }
  //             ]
  //         }
  //     ]
  // },
  // {
  //   "id" : 12
  // }
  //]
  // 1. Retrieves the first object and places it in the root comment array
  // 2. if it contains nested comments, iterates over the nested key;
  //                              if not, it goes to the next comment
  // Repeat steps 1 and 2 until all comments are gone

  const putItemToComments = (comment) => {
    if (count >= perPage * currentPage) return;
    count += 1;
    if (comment.nested) {
      const { nested, ...rest } = comment;
      if (count > skippedItems) {
        if (comment.topmost) {
          rootCommentsToReturn.push({ ...rest });
        } else {
          repliesToReturn.push({ ...rest });
        }
      }
      comment.nested.map((c) => {
        return putItemToComments(c);
      });
    } else {
      if (count > skippedItems) {
        repliesToReturn.push({ ...comment });
      }
    }
  };

  allComments.map((rootComment) => {
    if (count < perPage * currentPage) {
      if (rootComment.nested) {
        putItemToComments(rootComment);
      } else {
        count += 1;
        if (count > skippedItems) {
          const { nested, ...rest } = rootComment;
          rootCommentsToReturn.push({ ...rest });
        }
      }
    }
  });

  if (rootCommentsToReturn.length === 0) {
    let updatedRootComments = [...repliesToReturn];
    let repliesCopy = [...repliesToReturn];

    updatedRootComments = updatedRootComments.filter((root) => {
      return repliesCopy.some((child) => {
        return child.commentId === root.id;
      });
    });
    repliesToReturn = repliesToReturn.filter((reply) => {
      return updatedRootComments.some(
        (comment) => comment.id === reply.commentId
      );
    });

    rootCommentsToReturn = repliesCopy.filter(
      (f) =>
        !updatedRootComments
          .concat(repliesToReturn)
          .some((r) => r.id === f.commentId)
    );
  }

  io.getIO().emit("comments", {
    action: "getComments",
    comments: rootCommentsToReturn,
    replies: repliesToReturn,
    totalItems: totalItems,
  });

  res.status(200).json({
    message: "Success",
    comments: rootCommentsToReturn,
    replies: repliesToReturn,
    totalItems: totalItems,
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
