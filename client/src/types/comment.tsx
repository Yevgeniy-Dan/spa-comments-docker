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
};

export type SortBy = "date" | "email" | "username";
export type SortOrder = "asc" | "desc";
