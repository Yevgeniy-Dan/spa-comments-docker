const fs = require("fs");
const path = require("path");

const asyncHandler = require("express-async-handler");
const aws = require("aws-sdk");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const s3 = new aws.S3({
  apiVersion: process.env.COMMENTS_AWS_API_VERSION,
  accessKeyId: process.env.COMMENTS_AWS_ACCESS_KEY,
  secretAccessKey: process.env.COMMENTS_AWS_SECRET_KEY,
});

const fileStorage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (
    ext.toLowerCase() !== ".png" &&
    ext.toLowerCase() !== ".jpg" &&
    ext.toLowerCase() !== ".gif" &&
    ext.toLowerCase() !== ".txt"
  ) {
    req.fileValidationError = true;
    return cb(null, false);
  }
  cb(null, true);
};

exports.upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
});

exports.postFile = asyncHandler(async (req, res, next) => {
  if (req.fileValidationError) {
    const error = new Error(" Valid file extensions: [.png, .gif, .jpg, .txt]");
    error.statusCode = 422;
    throw error;
  }
  if (req.file) {
    const filePath = req.file.path.replace("\\", "/");

    let upload = {
      Key: `uploads/${uuidv4()}${path.extname(req.file.originalname)}`,
      Bucket: process.env.COMMENTS_AWS_BUCKET,
      ACL: "public-read",
      ContentType: req.file.mimetype,
    };

    if (req.file.mimetype === "text/plain") {
      if (req.file.size <= 100000) {
        const fileContent = fs.readFileSync(filePath);

        upload = {
          ...upload,
          Body: fileContent,
        };
      } else {
        return res.status(422).json({
          message: "File size is too large",
        });
      }
    } else {
      let image = sharp(filePath);
      const metadata = await image.metadata();

      if (metadata.width > 320) {
        image = await image.resize({ width: 320 }).toBuffer();
      } else if (metadata.length > 240) {
        image = await image.resize({ height: 240 }).toBuffer();
      } else {
        image = await image.toBuffer();
      }
      upload = {
        ...upload,
        Body: image,
      };
    }

    fs.rmSync(filePath, { force: true });
    uploadToAWSS3(upload, req, res, next);
  } else {
    next();
  }
});

const uploadToAWSS3 = (upload, req, res, next) => {
  s3.upload(upload, (err, uploadRes) => {
    if (err) {
      console.log(err);
      return res.status(422).json({
        message: "There was an error uploading a file",
        error: err,
      });
    } else {
      req.body.uploadUrl = uploadRes.Location; //save in req.body the url to the stored file
      next();
    }
  });
};
