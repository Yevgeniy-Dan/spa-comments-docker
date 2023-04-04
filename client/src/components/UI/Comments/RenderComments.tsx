import React, { useEffect, useMemo, useState } from "react";
import { Comment as CommentType } from "../../../types/comment";
import CommentItem from "./CommentItem";
import Attachments from "./Attachments";
import { useAppSelector } from "../../../hooks/redux";
import insertPreviewComment from "../../../utils/commentUtils";

const RenderComment: React.FC<{
  comment: CommentType;
  index: number;
  comments: CommentType[];
  depth: number;
}> = ({ index, comment, comments, depth }) => {
  const children = comments.filter((n) => n.parentId === comment.id);
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

  // Assigning a code to an attachment will ensure that the useState hooks for toggleImage and isOpenAttachments are always called in the same order on every render, regardless of the comment being rendered, i.e. they are at the top of the RenderComment function, before any conditional logic
  const attachments = comment.uploadUrl ? (
    <Attachments
      comment={comment}
      isOpen={isOpenAttachments}
      onToggleImage={() => setToggleImage(!toggleImage)}
      toggleImage={toggleImage}
    />
  ) : null;

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

const mergeComments = (
  comments: CommentType[],
  previewComment: CommentType | null
) => {
  return previewComment
    ? insertPreviewComment(comments, previewComment)
    : comments;
};

const RenderComments: React.FC<
  React.PropsWithChildren<{
    comments: CommentType[];
  }>
> = ({ comments }) => {
  const { previewComment } = useAppSelector((state) => state.comments);

  const mergedComments = useMemo(() => {
    return mergeComments(comments, previewComment);
  }, [comments, previewComment]);

  return (
    <div>
      {mergedComments
        .filter((c) => !c.parentId)
        .map((node, index) => (
          <RenderComment
            comment={node}
            comments={mergedComments}
            depth={0}
            index={index}
          />
        ))}
    </div>
  );
};

export default RenderComments;
