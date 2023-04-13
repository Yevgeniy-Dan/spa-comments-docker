import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type postParent = {
  parentId: number;
  userName: string;
} | null;

export type readyToSend = "pending" | "ready" | "inactive";

interface PreviewUploadFile {
  type: string;
  url: string;
  name: string;
}
type InitialState = {
  previewCommentId: string | null;
  previewUploadFile: PreviewUploadFile | null;
  postParent: postParent;
  firstCommentY: any;
  readyToSend: readyToSend;
};

const initialState: InitialState = {
  readyToSend: "inactive",
  previewCommentId: null,
  previewUploadFile: null,
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
    toggleReadyToSend: (state, action: PayloadAction<readyToSend>) => {
      state.readyToSend = action.payload;
    },
    setPreviewFileUrl: (state, action: PayloadAction<PreviewUploadFile>) => {
      state.previewUploadFile = action.payload;
    },
    setPreviewCommentId: (state, action: PayloadAction<string | null>) => {
      state.previewCommentId = action.payload;
    },
    removePreviewComment: (state) => {
      if (state.previewUploadFile?.url) {
        URL.revokeObjectURL(state.previewUploadFile.url);
      }
      state.previewCommentId = null;
      state.previewUploadFile = null;
    },
    setPostParentId: (state, action: PayloadAction<postParent | null>) => {
      if (action.payload) {
        state.postParent = {
          parentId: action.payload.parentId,
          userName: action.payload.userName,
        };
      } else {
        state.postParent = null;
      }
    },
  },
});

export const commentSliceActions = commentSlice.actions;
export default commentSlice;
