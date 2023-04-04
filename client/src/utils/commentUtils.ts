import { Comment as CommentType } from "../types/comment";

function insertPreviewComment(
  comments: CommentType[],
  previewComment: CommentType
): CommentType[] {
  const parentId = previewComment.parentId;

  let insertIndex = 0;

  if (parentId === null) {
    return [previewComment, ...comments];
  }

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];

    if (comment.id === parentId || comment.parentId === parentId) {
      insertIndex = i + 1;
    }
  }

  console.log([
    ...comments.slice(0, insertIndex),
    previewComment,
    ...comments.slice(insertIndex),
  ]);

  return [
    ...comments.slice(0, insertIndex),
    previewComment,
    ...comments.slice(insertIndex),
  ];
}

export default insertPreviewComment;
