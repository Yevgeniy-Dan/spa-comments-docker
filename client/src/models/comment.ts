class Comment {
  userName: string;
  email: string;
  text: string;
  captchaToken: string;
  homePage?: string | null;
  upload?: File | null;
  parentId?: number | null;
  createdAt: string | null;
  updatedAt: string | null;

  constructor(
    userName: string,
    email: string,
    text: string,
    captchaToken: string,
    homepage: string | null,
    upload: File | null,
    parentId: number | null,
    createdAt: string | null,
    updatedAt: string | null
  ) {
    this.userName = userName;
    this.email = email;
    this.text = text;
    this.captchaToken = captchaToken;
    this.homePage = homepage;
    this.upload = upload;
    this.parentId = parentId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default Comment;
