import { Comment as CommentType } from "../../types/comment";

export interface CommentResponse {
  comment: CommentType;
  reply: CommentType;
}

export interface CommentsResponse {
  comments: CommentType[];
  replies: CommentType[];
  totalItems: number;
}
