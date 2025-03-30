import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "../imagenes/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}`);
  },
});

export const upload = multer({ storage });
