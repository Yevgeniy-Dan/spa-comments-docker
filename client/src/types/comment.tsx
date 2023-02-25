export type ParentComment = {
  id: string;
  userName: string;
  email: string;
  homePage: string | null;
  uploadUrl: string | File | null;
  text: string;
  createdAt: string;
  isPreview: boolean | null;
};

export type ReplyComment = {
  replyId: string;
  commentId: string;
  id: string;
  replyToUsername: string;
  userName: string;
  email: string;
  homePage: string | null;
  uploadUrl: string | File | null;
  text: string;
  createdAt: string;
  isPreview: boolean | null;
};

export type SortBy = "date" | "email" | "username";
export type SortOrder = "asc" | "desc";
