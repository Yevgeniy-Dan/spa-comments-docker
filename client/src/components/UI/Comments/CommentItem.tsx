import React from "react";
import { ParentComment, ReplyComment } from "../../../types/comment";
import isReply from "../../../utils/isReplyType";

const CommentItem: React.FC<
  React.PropsWithChildren<{
    comment: ParentComment | ReplyComment | null;
    onReply: (parent: ParentComment) => void;
    onToggleAttachments?: () => void | null;
    isOpenAttachments: boolean;
  }>
> = ({ comment, onReply, onToggleAttachments, isOpenAttachments }) => {
  const getTime = (date: Date) => {
    return (
      new Date(comment!.createdAt).getHours() +
      ":" +
      new Date(comment!.createdAt).getMinutes()
    );
  };

  return (
    <>
      <div className={`card p-3 flex-grow-1 flex-shrink-1`}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex flex-row align-items-center text-break">
            <span>
              <small className="fw-bold text-primary">
                {comment!.userName}
              </small>
              <small className="fw-bold text-primary mx-1">
                {isReply(comment) && `@${comment.replyToUsername}`}
              </small>
              <small
                dangerouslySetInnerHTML={{ __html: comment!.text }}
              ></small>
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
            <small onClick={() => onReply(comment!)}>Reply</small>
          </div>
        </div>
        <div>
          {comment?.uploadUrl && (
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
    </>
  );
};

export default CommentItem;
