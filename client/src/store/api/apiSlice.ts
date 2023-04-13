import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CommentsResponse } from "../../models/response/CommentResponse";
import { SortParams } from "../../types/sort";

interface Params {
  sortParams: SortParams;
  page?: number;
  previewId?: number | null;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/comments",
  }),
  tagTypes: ["Comment"],
  endpoints: (builder) => ({
    getComments: builder.query<CommentsResponse, Params>({
      query: (params) => {
        return {
          url: `${process.env.REACT_APP_API_BASE_URL}/api/comments`,
          method: "GET",
          params: {
            page: params?.page,
            sortBy: params?.sortParams.sortBy,
            sortOrder: params?.sortParams.sortOrder,
            previewId: params?.previewId,
          },
        };
      },
      providesTags: ["Comment"],
    }),
    addNewComment: builder.mutation({
      query: ({ commentData, params }) => {
        return {
          url: `${process.env.REACT_APP_API_BASE_URL}/api/comments/add-comment`,
          method: "POST",
          body: commentData,
          params: params,
        };
      },
      // invalidatesTags: ["Comment"],
      // onCacheEntryAdded(arg, api) {
      //   api.dispatch(commentSliceActions.removePreviewComment());
      // },
    }),
    addPreviewComment: builder.mutation({
      query: ({ comment, previewId }) => {
        comment.append("id", previewId);
        return {
          url: `${process.env.REACT_APP_API_BASE_URL}/api/comments/add-preview-comment`,
          method: "POST",
          body: comment,
        };
      },
      // invalidatesTags: ["Comment"],
    }),
    deletePreviewComment: builder.mutation({
      query: (previewId) => {
        return {
          url: `${process.env.REACT_APP_API_BASE_URL}/api/comments/delete-preview-comment`,
          method: "POST",
          params: { previewId: previewId },
        };
      },
      // invalidatesTags: ["Comment"],
    }),
  }),
});

export const { useGetCommentsQuery, useAddNewCommentMutation } = apiSlice;
export default apiSlice;
