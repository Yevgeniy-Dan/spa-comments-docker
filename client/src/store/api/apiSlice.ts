import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import io from "socket.io-client";
import { CommentsResponse } from "../../models/response/CommentResponse";
import { SortParams } from "../../types/sort";
import { commentSliceActions } from "../comments/comment-slice";
interface GetCommentsResponse extends CommentsResponse {
  action: string;
}

interface Params {
  sortParams: SortParams;
  page: number;
}

const socket = io({
  host: `${process.env.REACT_APP_API_BASE_URL}`,
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/comments" }),
  tagTypes: ["Comment"],
  endpoints: (builder) => ({
    getComments: builder.query({
      query: (params: Params | null) => ({
        url:
          `${process.env.REACT_APP_API_BASE_URL}/api/comments` +
          `${
            params
              ? `?page=${params?.page.toString()}&sortBy=${
                  params?.sortParams.sortBy
                }&sortOrder=${params?.sortParams.sortOrder}`
              : ""
          }`,
        method: "GET",
      }),
      providesTags: ["Comment"],
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        try {
          await cacheDataLoaded;

          const listener = (data: GetCommentsResponse) => {
            if (data.action !== "getComments") return;

            const { action, ...rest } = data;
            updateCachedData((draft) => {
              Object.assign(draft, rest);
            });
          };

          socket.on("comments", listener);
        } catch (error) {
          await cacheEntryRemoved;

          socket.close();
        }
      },
    }),
    addNewComment: builder.mutation({
      query: (data) => ({
        url: `${process.env.REACT_APP_API_BASE_URL}/api/comments/add-comment${
          data.parentId ? "/" + data.parentId : ""
        }`,
        method: "POST",
        body: data.formData,
      }),
      invalidatesTags: ["Comment"],
      onCacheEntryAdded(arg, api) {
        api.dispatch(commentSliceActions.removePreviewComment());
      },
    }),
  }),
});

export const { useGetCommentsQuery, useAddNewCommentMutation } = apiSlice;
export default apiSlice;
