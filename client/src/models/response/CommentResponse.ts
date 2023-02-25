import { ParentComment, ReplyComment } from "../../types/comment";

export interface CommentResponse {
  comment: ParentComment;
  reply: ReplyComment;
}

export interface CommentsResponse {
  comments: ParentComment[];
  replies: ReplyComment[];
  totalItems: number;
}
