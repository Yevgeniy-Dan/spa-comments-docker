import React, { useEffect, useState } from "react";
import { Comment as CommentType } from "../../../types/comment";
import CommentItem from "./CommentItem";
import Attachments from "./Attachments";

const RenderComment: React.FC<{
  comment: CommentType;
  index: number;
  comments: CommentType[];
  depth: number;
}> = ({ index, comment, comments, depth }) => {
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

  const onToggleAttachments = () => {
    setIsOpenAttachments(!isOpenAttachments);
  };

  // Assigning a code to an attachment will ensure that the useState hooks
  // for toggleImage and isOpenAttachments are always called in the same order
  // on every render, regardless of the comment being rendered, i.e. they are at
  // the top of the RenderComment function, before any conditional logic
  const attachments = (
    <Attachments
      comment={comment}
      isOpen={isOpenAttachments}
      onToggleImage={() => setToggleImage(!toggleImage)}
      toggleImage={toggleImage}
    />
  );

  return (
    <div key={index} style={{ marginLeft }}>
      <CommentItem
        comment={comment}
        onToggleAttachments={() => {
          onToggleAttachments();
        }}
        isOpenAttachments={isOpenAttachments}
      />
      {attachments}
      {children.map((child, childIndex) => (
        <RenderComment
          comment={child}
          comments={comments}
          depth={depth + 1}
          index={childIndex}
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
            comment={node}
            comments={comments}
            depth={0}
            index={index}
          />
        ))}
    </div>
  );
};

export default RenderComments;
