const path = require("path");
const cors = require("cors");

const express = require("express");
const connectDB = require("./config/dbconnect");

const errorController = require("./controllers/error");

const { errorHandler } = require("./middleware/error");
const bodyParser = require("body-parser");

const commentRoutes = require("./routes/comment");
const { upload, postFile } = require("./utils/storage");
const initializeCommentTree = require("./config/initializeCommentTree");

const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

app.use(
  cors({
    credentials: true,
    origin: process.env.COMMENTS_CLIENT_ORIGIN,
  })
);

app.use(bodyParser.json());
app.use(upload.single("upload"), postFile);
app.use("uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/comments", commentRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname, "../", "client", "build", "index.html")
    )
  );
} else {
  app.get("/", (req, res) => res.send("Please set to production"));
}

app.use(errorController.get404);
app.use(errorHandler);

connectDB().then(async () => {
  try {
    await initializeCommentTree();

    const server = app.listen(
      process.env.NODE_DOCKER_PORT || process.env.PORT || 8080
    );
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("User connected ");
    });
  } catch (error) {
    throw new Error("From app.js: ", error);
  }
});
