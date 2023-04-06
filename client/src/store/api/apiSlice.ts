import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as io from "socket.io-client";
import { CommentsResponse } from "../../models/response/CommentResponse";
import { SortParams } from "../../types/sort";
import { commentSliceActions } from "../comments/comment-slice";

interface Params {
  sortParams: SortParams;
  page: number;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/comments" }),
  tagTypes: ["Comment"],
  endpoints: (builder) => ({
    getComments: builder.query<CommentsResponse, Params>({
      query: (params) => {
        console.log("Update Get comments");
        return {
          url: `${process.env.REACT_APP_API_BASE_URL}/api/comments`,
          method: "GET",
          params: {
            page: params?.page,
            sortBy: params?.sortParams.sortBy,
            sortOrder: params?.sortParams.sortOrder,
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
      invalidatesTags: ["Comment"],
      onCacheEntryAdded(arg, api) {
        api.dispatch(commentSliceActions.removePreviewComment());
      },
    }),
  }),
});

export const { useGetCommentsQuery, useAddNewCommentMutation } = apiSlice;
export default apiSlice;
