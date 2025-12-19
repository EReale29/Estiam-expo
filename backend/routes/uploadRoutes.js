import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadFile } from "../controllers/uploadController.js";
import { authenticateToken } from "../middleware/authenticate.js";
import { env } from "../config/env.js";

const router = Router();

fs.mkdirSync(env.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({ storage });

router.post("/uploads", authenticateToken, upload.single("file"), uploadFile);

export default router;
