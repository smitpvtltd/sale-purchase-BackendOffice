import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const baseUploadDir = process.env.BASE_UPLOAD_DIR;


function getStorage(folderName) {
  const folderPath = path.join(baseUploadDir, folderName);

  // Ensure directory exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, folderPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });
}

export function uploadFor(folderName) {
  return multer({
    storage: getStorage(folderName),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}
