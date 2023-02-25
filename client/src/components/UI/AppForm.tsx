import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { Col, FloatingLabel, Form, Row } from "react-bootstrap";
// import HCaptcha from "@hcaptcha/react-hcaptcha";
import ReCAPTCHA from "react-google-recaptcha";

import Comment from "../../models/comment";
import TagButtonPanel from "./TagButtonPanel";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { ParentComment, ReplyComment } from "../../types/comment";
import api from "../../http";
import AppSpinner from "./AppSpinner";
import { useAddNewCommentMutation } from "../../store/api/apiSlice";
import { commentSliceActions } from "../../store/comments/comment-slice";
import { getMessage } from "../../utils/getMessage";

const AppForm = () => {
  const dispatch = useAppDispatch();

  const postParent = useAppSelector((state) => state.comments.postParent);

  const { firstCommentY } = useAppSelector((state) => state.comments);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [captchaIsExpired, setCapthcaIsExpired] = useState<boolean>(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const homepageInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  const [scrollToPreview, setScrollToPreview] = useState<number>(0);

  useEffect(() => {
    if (captchaIsExpired) setToken(null);
  }, [captchaIsExpired]);

  const [validated, setValidated] = useState(false);
  useEffect(() => {
    if (firstCommentY) setScrollToPreview(firstCommentY);
  }, [firstCommentY]);

  useEffect(() => {
    setScrollToPreview(window.scrollY);
    window.scrollTo(0, 0);
  }, [postParent]);

  const createTag = (htmlTag: string, cursorPosition: number) => {
    let text = textInputRef.current!.value;

    if (htmlTag === "a") {
      return [
        text.slice(0, cursorPosition),
        `<${htmlTag}${htmlTag === "a" && ` href="" title=""`}></${htmlTag}>`,
        text.slice(cursorPosition),
      ].join("");
    }

    return [
      text.slice(0, cursorPosition),
      `<${htmlTag}></${htmlTag}>`,
      text.slice(cursorPosition),
    ].join("");
  };

  const handleChangeText = (newText: string, moveCursor: number) => {
    const cursorPosition = textInputRef.current!.selectionStart;

    textInputRef.current!.value = newText;
    textInputRef.current!.selectionStart = cursorPosition + moveCursor;
    textInputRef.current!.selectionEnd = cursorPosition + moveCursor;
    textInputRef.current!.focus();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleInsertTag = (htmlTag: string) => {
    const cursorPosition = textInputRef.current!.selectionStart;

    let newText = createTag(htmlTag, cursorPosition);
    switch (htmlTag) {
      case "i":
        handleChangeText(newText, 3);
        break;
      case "strong":
        handleChangeText(newText, 8);
        break;
      case "code":
        handleChangeText(newText, 6);
        break;
      case "a":
        handleChangeText(newText, 9);
        break;
      default:
        break;
    }
  };
  const [addNewComment, { isLoading, isError, error }] =
    useAddNewCommentMutation();

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsPreviewLoading(true);
    let parentCommentPreview: ParentComment = {} as ParentComment;

    let replyPreview: ReplyComment = {} as ReplyComment;

    if (!postParent?.parentId) {
      parentCommentPreview = {
        id: new Date().toISOString(),
        isPreview: true,
        createdAt: new Date().toISOString(),
        email: emailInputRef.current!.value,
        homePage: homepageInputRef.current?.value || null,
        text: textInputRef.current!.value,
        uploadUrl: uploadFile,
        userName: usernameInputRef.current!.value,
      };
      //show preview comment

      dispatch(commentSliceActions.addPreviewComment(parentCommentPreview));
    } else {
      replyPreview = {
        commentId: postParent!.parentId,
        replyId: "",
        createdAt: new Date().toISOString(),
        email: emailInputRef.current!.value,
        homePage: homepageInputRef.current?.value || null,
        text: textInputRef.current!.value,
        id: new Date().toISOString(),
        isPreview: true,
        replyToUsername: postParent!.userName,
        userName: usernameInputRef.current!.value,
        uploadUrl: uploadFile,
      };
      dispatch(commentSliceActions.addPreviewComment(replyPreview));
    }
    window.scrollTo(0, scrollToPreview);
    setIsPreviewLoading(false);
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget;
    if ((form as HTMLButtonElement).checkValidity() === false || !token) {
      event.stopPropagation();
      setValidated(true);
    } else {
      const newComment = new Comment(
        usernameInputRef.current!.value,
        emailInputRef.current!.value,
        textInputRef.current!.value,
        token,
        homepageInputRef.current?.value || null,
        uploadFile,
        null
      );
      if (postParent?.parentId) {
        newComment.parentId = postParent.parentId;
      }

      const formData = new FormData();
      formData.append("userName", newComment.userName);
      formData.append("email", newComment.email);
      formData.append("text", newComment.text);
      formData.append("captchaToken", newComment.captchaToken);
      if (newComment.homepage) formData.append("homepage", newComment.homepage);
      if (newComment.upload) formData.append("upload", newComment.upload);

      if (!isLoading) {
        try {
          const parentId = newComment.parentId || null;

          await addNewComment({
            parentId: parentId,
            formData: formData,
          }).unwrap();
          formRef.current!.classList.remove("was-validated");
          resetValues();
        } catch (error) {
          console.error("Failed to save the post: ", error);
        }
      }
    }
  };

  const resetValues = () => {
    formRef.current!.reset();
    setToken(null);
    setCapthcaIsExpired(false);
    captchaRef.current!.reset();
  };

  const handleVerificationToken = (token: string | null) => {
    if (token) {
      setToken(token);
      setCapthcaIsExpired(false);
    }
  };

  return (
    <div className="container">
      {isPreviewLoading && <AppSpinner />}
      <div className="col-md-7 col-lg-8 mx-auto">
        <h4 className="mb-3 text-center">
          Your Comment
          {postParent && (
            <>
              <span> [reply to: {postParent.userName}]</span>
              <button
                className="btn"
                style={{
                  borderWidth: "0",
                }}
                onClick={() => {
                  dispatch(commentSliceActions.setPostParentId(null));
                }}
              >
                Cancel
              </button>
            </>
          )}
        </h4>

        <Form
          ref={formRef}
          noValidate
          validated={validated}
          onSubmit={submitHandler}
        >
          <Row className="row g-3">
            <Col sm={6}>
              <Form.Group controlId="validationCustom01" className="col-12">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  required
                  type="text"
                  ref={usernameInputRef}
                  defaultValue=""
                />
                <Form.Control.Feedback type="invalid">
                  Your username is required.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col sm={6}>
              <Form.Group className="col-12">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  required
                  type="email"
                  placeholder="you@example.com"
                  ref={emailInputRef}
                  defaultValue=""
                />
                <Form.Control.Feedback type="invalid">
                  Please enter a valid email address.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Form.Group className="col-12">
              <Form.Label>Home page</Form.Label>
              <Form.Control
                type="homepage"
                ref={homepageInputRef}
                placeholder="https://yourhomepage.com"
                defaultValue=""
              />
            </Form.Group>

            <Form.Group>
              <div className="d-flex justify-content-between pb-3 align-items-end">
                <Form.Label className="mb-0">Comment</Form.Label>
                <div>
                  <TagButtonPanel
                    onClick={(value) => {
                      handleInsertTag(value);
                    }}
                  />
                </div>
              </div>
              <FloatingLabel controlId="floatingTextarea2" label="">
                <Form.Control
                  as="textarea"
                  required
                  placeholder="Leave a comment here"
                  style={{ height: "200px" }}
                  ref={textInputRef}
                  defaultValue=""
                />
                <Form.Control.Feedback type="invalid">
                  Please enter your comment.
                </Form.Control.Feedback>
              </FloatingLabel>
            </Form.Group>

            <Form.Group>
              <div className="mb-3">
                <input
                  className="form-control"
                  type="file"
                  id="formFile"
                  onChange={handleFileChange}
                />
              </div>
            </Form.Group>

            <Form.Group>
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={`${process.env.REACT_APP_RECAPTCHA_SITEKEY}`}
                onChange={(token) => {
                  handleVerificationToken(token);
                }}
                onExpired={() => {
                  console.log("OK");
                  setCapthcaIsExpired(true);
                }}
              />
              {!token && validated && (
                <p className="text-danger">
                  This is hCaptcha for human testing.
                </p>
              )}

              {!token && captchaIsExpired && (
                <p className="text-danger">
                  The hCaptcha for human testing has expired.
                </p>
              )}
            </Form.Group>
          </Row>
          {isError && (
            <div className="alert alert-danger mt-4" role="alert">
              {getMessage(error)}
            </div>
          )}
          <div className="my-4"></div>
          <Row>
            <Col sm={6}>
              <button
                className="w-100 btn btn-primary mb-3"
                onClick={handlePreview}
              >
                Preview
              </button>
            </Col>
            <Col sm={6}>
              <button className="w-100 btn btn-primary" type="submit">
                Send Comment
              </button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default AppForm;
