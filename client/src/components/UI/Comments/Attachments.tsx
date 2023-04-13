import React, { useEffect, useRef } from "react";
import { Comment as CommentType } from "../../../types/comment";
import { Accordion, Collapse } from "react-bootstrap";
import FsLightbox from "fslightbox-react";
import { useAppSelector } from "../../../hooks/redux";

const Attachments: React.FC<
  React.PropsWithChildren<{
    comment: CommentType;
    toggleImage: boolean;
    isOpen: boolean;
    onToggleImage: () => void;
  }>
> = ({ comment, isOpen, toggleImage, onToggleImage }) => {
  const previewUploadFile = useAppSelector(
    (state) => state.comments.previewUploadFile
  );

  return (
    <Collapse in={isOpen}>
      <Accordion defaultActiveKey="0" flush className="mt-2">
        <Accordion.Item eventKey="0">
          <Accordion.Body>
            {comment.uploadUrl && typeof comment.uploadUrl === "string" ? (
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
              previewUploadFile && (
                <div className="text-break">
                  <FsLightbox
                    toggler={toggleImage}
                    sources={[previewUploadFile.url]}
                  />

                  {previewUploadFile.type === "text/plain" ? (
                    <a href={`${previewUploadFile.url}`}>
                      {previewUploadFile.name}
                    </a>
                  ) : (
                    <img
                      src={`${previewUploadFile.url}`}
                      alt={previewUploadFile.name}
                      style={{ cursor: "pointer" }}
                      width={320}
                      height="auto"
                      onClick={() => onToggleImage()}
                    />
                  )}
                </div>
              )
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Collapse>
  );
};

export default Attachments;
