import { ReplyComment } from "../types/comment";

const isReply = (comment: any): comment is ReplyComment => {
  return (comment as ReplyComment).replyToUsername !== undefined;
};

export default isReply;
