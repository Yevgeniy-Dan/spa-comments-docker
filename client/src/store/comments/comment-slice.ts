import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ParentComment, ReplyComment } from "../../types/comment";
import isReply from "../../utils/isReplyType";

type postParent = {
  parentId: string;
  userName: string;
} | null;

type InitialState = {
  previewComment: ParentComment | null;
  previewReply: ReplyComment | null;
  postParent: postParent;
  firstCommentY: any;
};

const initialState: InitialState = {
  previewComment: null,
  previewReply: null,
  postParent: null,
  firstCommentY: null,
};

const commentSlice = createSlice({
  name: "comments",
  initialState: initialState,
  reducers: {
    reset: (state) => initialState,
    addRefToFirstComment: (state, action: PayloadAction<number>) => {
      state.firstCommentY = action.payload;
    },
    addPreviewComment: (
      state,
      action: PayloadAction<ParentComment | ReplyComment>
    ) => {
      state.previewComment = null;
      state.previewReply = null;
      if (isReply(action.payload)) {
        state.previewReply = action.payload;
      } else {
        state.previewComment = action.payload;
      }
    },
    removePreviewComment: (state) => {
      state.previewComment = null;
      state.previewReply = null;
    },
    setPostParentId: (state, action: PayloadAction<postParent | null>) => {
      if (action.payload) {
        state.postParent = {
          ...action.payload,
        };
      } else {
        state.postParent = null;
      }
    },
  },
});

export const commentSliceActions = commentSlice.actions;
export default commentSlice;
