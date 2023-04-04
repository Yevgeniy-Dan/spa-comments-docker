import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Comment as CommentType } from "../../types/comment";

type postParent = {
  parentId: number;
  userName: string;
} | null;

type InitialState = {
  previewComment: CommentType | null;
  postParent: postParent;
  firstCommentY: any;
};

const initialState: InitialState = {
  previewComment: null,
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
      action: PayloadAction<CommentType | CommentType>
    ) => {
      state.previewComment = action.payload;
    },
    removePreviewComment: (state) => {
      state.previewComment = null;
    },
    setPostParentId: (state, action: PayloadAction<postParent | null>) => {
      state.previewComment = null;
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
