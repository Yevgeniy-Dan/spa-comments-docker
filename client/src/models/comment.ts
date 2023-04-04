class Comment {
  userName: string;
  email: string;
  text: string;
  captchaToken: string;
  homepage?: string | null;
  upload?: File | null;
  parentId?: number | null;
  isPreview?: boolean;

  constructor(
    userName: string,
    email: string,
    text: string,
    captchaToken: string,
    homepage: string | null,
    upload: File | null,
    parentId: number | null,
    isPreview?: boolean
  ) {
    this.userName = userName;
    this.email = email;
    this.text = text;
    this.captchaToken = captchaToken;
    this.homepage = homepage;
    this.upload = upload;
    this.parentId = parentId;
    this.isPreview = isPreview || false;
  }
}

export default Comment;
