import React, {
  useEffect,
  useRef,
  useLayoutEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import classnames from "classnames";
import BootstrapTable from "react-bootstrap-table-next";

import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { commentSliceActions } from "../../../store/comments/comment-slice";
import { SortBy, SortOrder } from "../../../types/comment";
import apiSlice, { useGetCommentsQuery } from "../../../store/api/apiSlice";
import AppSpinner from "../AppSpinner";
import Paginator from "../Paginator";

import constants from "../../../constants";
import "./Comments.css";
import { SortParams } from "../../../types/sort";
import RenderComments from "./RenderComments";
import * as io from "socket.io-client";

const Comments: React.FC = () => {
  const [sortParams, setSortParams] = useState<SortParams>({
    sortBy: "date",
    sortOrder: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const firstCommentRef = useRef<any>(null);

  const { readyToSend, previewCommentId, firstCommentY } = useAppSelector(
    (state) => state.comments
  );
  const [previewId, setPreviewId] = useState<number | null>(null);

  const previewCommentIdRef = useRef(previewCommentId);
  const readyToSendRef = useRef(readyToSend);

  useEffect(() => {
    previewCommentIdRef.current = previewCommentId;
  }, [previewCommentId]);

  useEffect(() => {
    readyToSendRef.current = readyToSend;
  }, [readyToSend]);

  const dispatch = useAppDispatch();

  const socket = useMemo(() => {
    return io.connect(`${process.env.REACT_APP_API_BASE_URL}`, {
      withCredentials: true,
    });
  }, []);

  const listener = useCallback(
    (data: any) => {
      switch (data.action) {
        case "getComments":
          const updatedPage = Number(data.page);
          if (updatedPage) {
            setCurrentPage(updatedPage); //extra request, will need to be reconsidered
          }
          return;
        case "addComment":
          // Maybe we would Invalidate the cache for the 'getComments'
          // when page from data.page will be equal to currentPage to
          // prevent redundance reloade

          // Invalidate the cache for the `getComments` endpoint
          // dispatch(commentSliceActions.setCommentFormData(null));
          dispatch(apiSlice.util.invalidateTags(["Comment"]));
          return;
        case "addPreview":
          if (data.previewId === previewCommentIdRef.current) {
            setPreviewId(data.previewId); // Does not change the value on the second and subsequent requests
            dispatch(apiSlice.util.invalidateTags(["Comment"])); //Therefore, we clearly invalidate the cache for the `getComments` endpoint
          }
          return;

        case "deletePreviewComment":
          if (data.outdatedPreviewId === previewCommentIdRef.current) {
            dispatch(commentSliceActions.removePreviewComment());
            setPreviewId(null);
            if (readyToSendRef.current === "pending") {
              dispatch(commentSliceActions.toggleReadyToSend("ready"));
            }
          }
          return;
        default:
          return;
      }
    },
    [dispatch, readyToSendRef, previewCommentIdRef]
  );

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server: ", socket.connected);
      socket.on("comments", listener);
    });
    return () => {
      // socket.off("comments", listener);
      // socket.disconnect();
    };
  }, [socket, listener]);

  const {
    data: comments,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error: message,
  } = useGetCommentsQuery(
    {
      page: currentPage,
      sortParams: { ...sortParams },
      previewId: previewId,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  useLayoutEffect(() => {
    const interval = setInterval(() => {
      if (firstCommentRef?.current?.getBoundingClientRect) {
        const { y } = firstCommentRef.current.getBoundingClientRect();
        dispatch(commentSliceActions.addRefToFirstComment(y));
        clearInterval(interval);
      }
    }, 100);
  }, [firstCommentRef, dispatch]);

  const getSortedComments = (
    sortByValue: SortBy,
    sortOrderValue: SortOrder
  ) => {
    setSortParams({
      sortBy: sortByValue,
      sortOrder: sortOrderValue,
    });
  };

  const columns = [
    {
      dataField: "userName",
      text: "Username",
      sort: true,
      onSort: (fieldName: string, order: SortOrder) => {
        getSortedComments(
          "username",
          sortParams.sortOrder === "asc" && sortParams.sortBy === "username"
            ? "desc"
            : "asc"
        );
      },
    },
    {
      dataField: "email",
      text: "E-Mail",
      sort: true,
      onSort: (fieldName: string, order: string) => {
        getSortedComments(
          "email",
          sortParams.sortOrder === "asc" && sortParams.sortBy === "email"
            ? "desc"
            : "asc"
        );
      },
    },
    {
      dataField: "createdAt",
      text: "Data",
      sort: true,
      onSort: (fieldName: string, order: string) => {
        getSortedComments(
          "date",
          sortParams.sortOrder === "asc" && sortParams.sortBy === "date"
            ? "desc"
            : "asc"
        );
      },
    },
  ];

  useEffect(() => {
    if (isError) console.log(message);
  }, [isError, message]);

  let content;

  if (isLoading) {
    content = <AppSpinner />;
  } else if (isSuccess) {
    if (comments.comments.length > 0) {
      const renderedComents = (
        <div ref={firstCommentRef}>
          <>
            <>
              <BootstrapTable
                bootstrap4
                keyField="id"
                bordered={false}
                data={comments.comments}
                columns={columns}
                wrapperClasses="table-responsive"
              />
            </>

            <RenderComments comments={comments.comments} />

            <Paginator
              currentPage={currentPage}
              lastPage={Math.max(
                Math.ceil(comments.totalItems / constants.perPage),
                1
              )}
              onPageChange={(page) => {
                window.scrollTo(0, firstCommentY);
                setCurrentPage(page);
              }}
            />
          </>
        </div>
      );

      const containerClassName = classnames("comments-container", {
        disabled: isFetching,
      });

      content = <div className={containerClassName}>{renderedComents}</div>;
    }
  } else if (isError) {
    content = <div>An error has occurred</div>;
    // content = <div>{getMessage(error)}</div>;
  }

  return (
    <div className="container my-5 py-5">
      <div className="row d-flex justify-content-center">
        <div className="col-md-12 col-lg-10 col-xl-8">
          <div className="row">{content}</div>
        </div>
      </div>
    </div>
  );
};

export default Comments;
