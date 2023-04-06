const Comment = require("../models/comment");
const ReplyTo = require("../models/replyTo");
const commentTree = require("../utils/comment-tree/comment-tree");

const populateSortedComments = async () => {
  const [comments, replies] = await Promise.all([
    Comment.findAll(),
    ReplyTo.findAll(),
  ]);

  // if the order in which the queries are executed is important
  // const comments = await Comment.findAll();
  // const replies = await ReplyTo.findAll();

  for (let r of replies) {
    commentTree.addReplyIdObj(r.commentId, r.replyId);
  }

  for (let c of comments) {
    commentTree.addComment(c.dataValues);
  }

  for (let r of replies) {
    commentTree.addEdge(r.commentId, r.replyId);
  }

  const sortedComments = commentTree.sort("date", "desc");

  return sortedComments;
};

module.exports = populateSortedComments;
