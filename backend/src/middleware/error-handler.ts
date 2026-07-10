import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Requete invalide",
      details: error.issues,
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(413).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image trop volumineuse"
          : "Upload invalide",
      details: error.message,
    });
  }

  if (error instanceof Error && error.name === "AbortError") {
    return res.status(504).json({
      error: "Timeout pendant l'analyse de l'image",
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Erreur pendant l'analyse de l'image",
  });
}
