import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
} from "react";
import { Col, FloatingLabel, Form, Row } from "react-bootstrap";
import ReCAPTCHA from "react-google-recaptcha";

import Comment from "../../models/comment";
import TagButtonPanel from "./TagButtonPanel";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { Comment as CommentType } from "../../types/comment";
import AppSpinner from "./AppSpinner";
import apiSlice, { useAddNewCommentMutation } from "../../store/api/apiSlice";
import { commentSliceActions } from "../../store/comments/comment-slice";
import { getMessage } from "../../utils/getMessage";
import "./AppForm.css";
import classNames from "classnames";
import { v4 as uuidv4 } from "uuid";

const AppForm = () => {
  const dispatch = useAppDispatch();

  const postParent = useAppSelector((state) => state.comments.postParent);

  const { readyToSend, previewCommentId, firstCommentY } = useAppSelector(
    (state) => state.comments
  );
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
  const [addNewComment, { isLoading }] = useAddNewCommentMutation();

  const [error, setError] = useState<any>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsPreviewLoading(true);

    const commentPreview = buildPreviewComment();
    const formData = formSendData(commentPreview);

    let prevId = previewCommentId;
    if (!previewCommentId) {
      const uuid = uuidv4();
      dispatch(commentSliceActions.setPreviewCommentId(uuid));
      prevId = uuid;
    }

    if (uploadFile) {
      const objectUrl = URL.createObjectURL(uploadFile);
      dispatch(
        commentSliceActions.setPreviewFileUrl({
          type: uploadFile.type,
          url: objectUrl,
          name: uploadFile.name,
        })
      );
    }

    await dispatch(
      apiSlice.endpoints.addPreviewComment.initiate({
        comment: formData,
        previewId: prevId,
      })
    );
    // window.scrollTo(0, scrollToPreview);
    setIsPreviewLoading(false);
  };

  // When we define close button on preview card to cancel preview
  const clearPreviewComment = async () => {
    await dispatch(
      apiSlice.endpoints.deletePreviewComment.initiate(previewCommentId)
    );
  };

  const buildComment = useCallback(() => {
    const newComment = new Comment(
      usernameInputRef.current!.value,
      emailInputRef.current!.value,
      textInputRef.current!.value,
      token!,
      homepageInputRef.current?.value || null,
      uploadFile,
      null,
      null,
      null
    );
    if (postParent?.parentId) {
      newComment.parentId = postParent.parentId;
    }

    return newComment;
  }, [postParent, token, uploadFile]);

  const buildPreviewComment = useCallback(() => {
    const commentPreview = new Comment(
      usernameInputRef.current!.value,
      emailInputRef.current!.value,
      textInputRef.current!.value,
      "",
      homepageInputRef.current?.value || null,
      null,
      postParent?.parentId || null,
      new Date().toISOString(),
      new Date().toISOString()
    );

    return commentPreview;
  }, [postParent]);

  const formSendData = useCallback((newComment: any) => {
    const formData = new FormData();

    Object.entries(newComment).forEach(([key, value]) => {
      if (!(value instanceof File) && value !== null) {
        formData.append(key, value as string);
      }
      if (value instanceof File) {
        formData.append(key, value);
      }
    });

    return formData;
  }, []);

  useEffect(() => {
    const sendData = async () => {
      const newComment = buildComment();
      const formData = formSendData(newComment);
      const parentId = postParent?.parentId;

      await dispatch(
        apiSlice.endpoints.addNewComment.initiate({
          params: { parentId: parentId },
          commentData: formData,
        })
      )
        .then((response: any) => {
          if (response?.error) {
            setError(response?.error);
          } else {
            dispatch(commentSliceActions.toggleReadyToSend("inactive"));
            formRef.current!.classList.remove("was-validated");
            resetValues();
          }
        })
        .catch((err) => {
          console.log(err);
          setError(err?.error);
        });
    };
    if (readyToSend === "ready") {
      sendData();
    }
  }, [readyToSend, postParent, dispatch, formSendData, buildComment]);

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget;
    if ((form as HTMLButtonElement).checkValidity() === false || !token) {
      event.stopPropagation();
      setValidated(true);
    } else {
      if (!isLoading) {
        try {
          const parentId = postParent?.parentId;

          if (!previewCommentId) {
            const newComment = buildComment();
            const formData = formSendData(newComment);

            await dispatch(
              apiSlice.endpoints.addNewComment.initiate({
                params: { parentId: parentId },
                commentData: formData,
              })
            )
              .then((response: any) => {
                if (response?.error) {
                  setError(response?.error);
                } else {
                  formRef.current!.classList.remove("was-validated");
                  resetValues();
                }
              })
              .catch((err) => {
                console.log(err);
                setError(err?.error);
              });
          } else {
            dispatch(commentSliceActions.toggleReadyToSend("pending"));
            await clearPreviewComment();
          }
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
    dispatch(commentSliceActions.setPostParentId(null));
    captchaRef.current!.reset();
  };

  const handleVerificationToken = (token: string | null) => {
    if (token) {
      setToken(token);
      setCapthcaIsExpired(false);
    }
  };

  const containerClassName = classNames("form-container", {
    disabled: isLoading || isPreviewLoading,
  });

  return (
    <div className={`container ${containerClassName}`}>
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
                  setCapthcaIsExpired(true);
                }}
              />
              {!token && validated && (
                <p className="text-danger">
                  This is reCaptcha for human testing.
                </p>
              )}

              {!token && captchaIsExpired && (
                <p className="text-danger">
                  The reCaptcha for human testing has expired.
                </p>
              )}
            </Form.Group>
          </Row>
          {error && (
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
