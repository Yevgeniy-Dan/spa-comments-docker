import React, { useEffect, useRef, useState } from "react";
import { Accordion, Collapse } from "react-bootstrap";
import FsLightbox from "fslightbox-react";

import { ParentComment, ReplyComment } from "../../../types/comment";
import CommentItem from "./CommentItem";
import "./Comments.css";
import { useGetCommentsQuery } from "../../../store/api/apiSlice";
import { useAppSelector } from "../../../hooks/redux";

const Comment: React.FC<
  React.PropsWithChildren<{
    comment: ParentComment | ReplyComment | null;
    onReply: (parent: ParentComment) => void;
  }>
> = ({ comment, onReply = (f) => f }) => {
  const { data: comments, isLoading, isSuccess } = useGetCommentsQuery(null);
  const { previewReply } = useAppSelector((state) => state.comments);

  const [isOpenAttachments, setIsOpenAttachments] = useState<boolean>(false);
  const [toggleImage, setToggleImage] = useState<boolean>(false);

  let content;
  let updatedReplies = comments && comments.replies;

  const previewImageUrl = useRef<{
    type: string;
    url: string;
    name: string;
  }>({
    name: "",
    type: "",
    url: "",
  });

  if (previewReply && updatedReplies) {
    updatedReplies = [...comments.replies, previewReply];
  }

  if (isSuccess && !isLoading && updatedReplies.length > 0) {
    const replies = updatedReplies.filter(
      (reply: ReplyComment) => reply.commentId === comment?.id
    );
    content = (
      <div>
        {replies.map((reply: ReplyComment) => (
          <div key={reply.id} className="ms-5">
            <Comment comment={reply} onReply={onReply} />
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    if (
      comment?.isPreview &&
      comment.uploadUrl &&
      typeof comment.uploadUrl !== "string"
    ) {
      const blob: File = comment.uploadUrl;

      const objectUrl = URL.createObjectURL(blob);
      previewImageUrl.current = {
        type: blob.type,
        url: objectUrl,
        name: blob.name,
      };
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [comment]);

  return (
    <div className="mt-4">
      {comment && (
        <>
          <CommentItem
            comment={comment}
            onReply={onReply}
            onToggleAttachments={() => setIsOpenAttachments(!isOpenAttachments)}
            isOpenAttachments={isOpenAttachments}
          />
          {comment.uploadUrl && (
            <Collapse in={isOpenAttachments}>
              <Accordion defaultActiveKey="0" flush className="mt-2">
                <Accordion.Item eventKey="0">
                  <Accordion.Body>
                    {typeof comment.uploadUrl === "string" ? (
                      <div className="text-break">
                        <FsLightbox
                          toggler={toggleImage}
                          sources={[comment.uploadUrl]}
                        />
                        {comment.uploadUrl.endsWith(".txt") ? (
                          <a href={`${comment.uploadUrl}`}>
                            {comment.uploadUrl}
                          </a>
                        ) : (
                          <img
                            src={`${comment.uploadUrl}`}
                            alt=""
                            style={{ cursor: "pointer" }}
                            onClick={() => setToggleImage(!toggleImage)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-break">
                        <FsLightbox
                          toggler={toggleImage}
                          sources={[previewImageUrl.current.url]}
                        />
                        {previewImageUrl.current.type === "text/plain" ? (
                          <a href={`${previewImageUrl.current.url}`}>
                            {previewImageUrl.current.name}
                          </a>
                        ) : (
                          <img
                            src={`${previewImageUrl.current.url}`}
                            alt={previewImageUrl.current.name}
                            style={{ cursor: "pointer" }}
                            width={320}
                            height="auto"
                            onClick={() => setToggleImage(!toggleImage)}
                          />
                        )}
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Collapse>
          )}
        </>
      )}
      {content}
    </div>
  );
};

export default Comment;
