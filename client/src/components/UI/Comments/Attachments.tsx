import React, { useState, useEffect, useRef } from "react";
import { Comment as CommentType } from "../../../types/comment";
import { Accordion, Collapse } from "react-bootstrap";
import FsLightbox from "fslightbox-react";

const Attachments: React.FC<
  React.PropsWithChildren<{
    comment: CommentType;
    toggleImage: boolean;
    isOpen: boolean;
    onToggleImage: () => void;
  }>
> = ({ comment, isOpen, toggleImage, onToggleImage }) => {
  const previewImageUrl = useRef<{
    type: string;
    url: string;
    name: string;
  }>({
    name: "",
    type: "",
    url: "",
  });

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
    <Collapse in={isOpen}>
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
                  <a href={`${comment.uploadUrl}`}>{comment.uploadUrl}</a>
                ) : (
                  <img
                    src={`${comment.uploadUrl}`}
                    alt=""
                    style={{ cursor: "pointer" }}
                    onClick={() => onToggleImage()}
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
                    onClick={() => onToggleImage()}
                  />
                )}
              </div>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Collapse>
  );
};

export default Attachments;
