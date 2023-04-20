import React, { useCallback, useEffect, useState } from "react";
import { Comment as CommentType } from "../../../types/comment";
import CommentItem from "./CommentItem";
import Attachments from "./Attachments";

const RenderComment: React.FC<{
  comment: CommentType;
  comments: CommentType[];
  depth: number;
}> = ({ comment, comments, depth }) => {
  const children = comments
    .filter((n) => n.parentId === comment.id)
    .map((n) => {
      return {
        ...n,
        replyToUsername: comment.userName,
      };
    });
  const marginLeft = depth * 20;

  const [toggleImage, setToggleImage] = useState<boolean>(false);
  const [isOpenAttachments, setIsOpenAttachments] = useState<boolean>(
    comment.isOpenAttachments
  );

  useEffect(() => {
    setIsOpenAttachments(comment.isOpenAttachments);
  }, [comment.isOpenAttachments]);

  const onToggleAttachments = useCallback(() => {
    setIsOpenAttachments((prev: boolean) => !prev);
  }, []);

  // Assigning a code to an attachment will ensure that the useState hooks
  // for toggleImage and isOpenAttachments are always called in the same order
  // on every render, regardless of the comment being rendered, i.e. they are at
  // the top of the RenderComment function, before any conditional logic
  const attachments = (
    <Attachments
      comment={comment}
      isOpen={isOpenAttachments}
      onToggleImage={useCallback(
        () => setToggleImage((prev: boolean) => !prev),
        []
      )}
      toggleImage={toggleImage}
    />
  );

  return (
    <div style={{ marginLeft }}>
      <CommentItem
        comment={comment}
        onToggleAttachments={() => {
          onToggleAttachments();
        }}
        isOpenAttachments={isOpenAttachments}
      />
      {attachments}
      {children.map((child) => (
        <RenderComment
          key={child.id}
          comment={child}
          comments={comments}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

const RenderComments: React.FC<
  React.PropsWithChildren<{
    comments: CommentType[];
  }>
> = ({ comments }) => {
  return (
    <div>
      {comments
        .filter((c) => !c.parentId)
        .map((node, index) => (
          <RenderComment
            key={node.id}
            comment={node}
            comments={comments}
            depth={0}
          />
        ))}
    </div>
  );
};

export default RenderComments;
