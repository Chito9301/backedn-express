import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mi-app", // carpeta en Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "gif", "mp4", "webm"], // admite imágenes y videos
  },
});

const upload = multer({ storage });

export default upload;
