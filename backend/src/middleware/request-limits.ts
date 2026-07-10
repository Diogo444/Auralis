import multer from "multer";
import { env } from "../config/env.js";
import { HttpError } from "./error-handler.js";
import { isAcceptedImageMimeType } from "../schemas/analysis.schema.js";

export const uploadAnalysisFrame = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxImageBytes,
    files: 1,
    fields: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAcceptedImageMimeType(file.mimetype)) {
      callback(new HttpError(415, "Type d'image non supporte"));
      return;
    }

    callback(null, true);
  },
});
