export type Comment = {
  id: number;
  userName: string;
  email: string;
  homePage: string | null;
  uploadUrl: string | File | null;
  text: string;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
  isPreview: boolean | null;
  replyToUsername: string;
  isOpenAttachments: boolean;
  token?: string;
};

export type AddComment = {
  userName: string;
  email: string;
  text: string;
  captchaToken: string;
  homepage?: string | null;
  upload?: File | null;
  parentId?: number | null;
  isPreview?: boolean;
};

export type SortBy = "date" | "email" | "username";
export type SortOrder = "asc" | "desc";
