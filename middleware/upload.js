const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "image");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer(
  {
    storage: storage,
    limits: {
      fileSize: 3000000,
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Please upload an image"));
      }
      cb(undefined, true);
    },
  },
  (error, req, res, next) => {
    res.status(404).send({ error: error.message });
  }
);

module.exports = upload;
