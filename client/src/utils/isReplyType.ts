import { Comment as CommentType } from "../types/comment";

const isReply = (comment: any): comment is CommentType => {
  return (comment as CommentType).replyToUsername !== undefined;
};

export default isReply;
