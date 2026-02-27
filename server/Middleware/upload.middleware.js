const multer = require("multer");
const path = require("path");

// Filter for Excel files only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls"];
  const extname = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error(`Only Excel files are allowed. Invalid extension: ${extname}`));
  }
};

// Use MEMORY storage (IMPORTANT for Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;