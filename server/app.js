const path = require("path");
const cors = require("cors");
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const errorController = require("./controllers/error");

const { errorHandler } = require("./middleware/error");
const bodyParser = require("body-parser");

const commentRoutes = require("./routes/comment");
const { upload, postFile } = require("./util/storage");

connectDB();

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_ORIGIN || "http://localhost:8081",
  })
);

app.use(bodyParser.json());
app.use(upload.single("upload"), postFile);
app.use("uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/comments", commentRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => res.send("Please set to production"));
}

app.use(errorController.get404);
app.use(errorHandler);

const server = app.listen(process.env.NODE_DOCKER_PORT || 8080);
const io = require("./socket").init(server);
io.on("connection", (socket) => {});
