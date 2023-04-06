import React, { useEffect, useRef, useLayoutEffect, useState } from "react";
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
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = io.connect(`${process.env.REACT_APP_API_BASE_URL}`, {
      withCredentials: true,
    });

    const listener = (data: any) => {
      if (data.action !== "addComment") return;

      // Invalidate the cache for the `getComments` endpoint
      dispatch(apiSlice.util.invalidateTags(["Comment"]));
    };

    socket.on("comments", listener);

    return () => {
      socket.off("comments", listener);
      socket.disconnect();
    };
  }, [dispatch]);

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
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const firstCommentRef = useRef<any>(null);

  const { previewComment, firstCommentY } = useAppSelector(
    (state) => state.comments
  );

  // useEffect(() => {
  //   if (currentPage > 1 && previewComment) setCurrentPage(1);
  // }, [previewComment, currentPage]);

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

  const loadPosts = (direction: "previous" | "next") => {
    let page = currentPage;
    if (direction === "next") {
      //request to database
      page++;
      dispatch(commentSliceActions.removePreviewComment());
      setCurrentPage(page);
    }
    if (direction === "previous") {
      //request to database
      page--;
      dispatch(commentSliceActions.removePreviewComment());
      setCurrentPage(page);
    }
  };

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
              lastPage={Math.ceil(comments.totalItems / constants.perPage)}
              onNext={() => {
                window.scrollTo(0, firstCommentY);
                loadPosts("next");
              }}
              onPrevious={() => {
                window.scrollTo(0, firstCommentY);
                loadPosts("previous");
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
