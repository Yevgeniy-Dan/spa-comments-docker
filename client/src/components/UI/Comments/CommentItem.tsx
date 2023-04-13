import React from "react";
import { Comment as CommentType } from "../../../types/comment";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { commentSliceActions } from "../../../store/comments/comment-slice";

const CommentItem: React.FC<
  React.PropsWithChildren<{
    comment: CommentType | CommentType | null;
    onToggleAttachments?: () => void | null;
    isOpenAttachments: boolean;
  }>
> = ({ comment, onToggleAttachments, isOpenAttachments }) => {
  const dispatch = useAppDispatch();

  const previewUploadFile = useAppSelector(
    (state) => state.comments.previewUploadFile
  );

  const getTime = (date: Date) => {
    return (
      new Date(comment!.createdAt).getHours() +
      ":" +
      new Date(comment!.createdAt).getMinutes()
    );
  };

  const onHandleReply = (comment: CommentType) => {
    dispatch(
      commentSliceActions.setPostParentId({
        parentId: comment.id,
        userName: comment.userName,
      })
    );
  };

  return (
    <div
      className={`card p-3 flex-grow-1 flex-shrink-1 mb-2 ${
        comment?.isPreview && "preview-card"
      }`}
    >
      <div className="d-flex justify-content-between align-items-start">
        <div className="d-flex flex-row align-items-center text-break">
          <span>
            <small className="fw-bold text-primary">{comment!.userName}</small>
            <small className="fw-bold text-primary mx-1">
              {comment?.parentId && `@${comment?.replyToUsername}`}
            </small>
            <small dangerouslySetInnerHTML={{ __html: comment!.text }}></small>
          </span>
        </div>
        <div>
          <small className="me-3">
            {new Date(comment!.createdAt).toLocaleDateString()}
          </small>
          <small>{getTime(new Date(comment!.createdAt))}</small>
        </div>
      </div>

      <div className="action d-flex justify-content-between mt-2 align-items-center">
        <div className="reply">
          {comment?.isPreview ? (
            <small>Reply</small>
          ) : (
            <small onClick={() => onHandleReply(comment!)}>Reply</small>
          )}
        </div>
      </div>
      <div>
        {(comment?.uploadUrl || (comment?.isPreview && previewUploadFile)) && (
          <p
            className="mb-0 text-secondary"
            style={{
              cursor: "pointer",
            }}
            onClick={onToggleAttachments}
          >
            Attached
            <i
              className={`bi ${
                isOpenAttachments
                  ? "bi-arrow-up-circle"
                  : "bi-arrow-down-circle"
              } ms-2`}
            ></i>
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
