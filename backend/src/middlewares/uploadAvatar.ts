import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

export const uploadsDirectory = path.resolve(__dirname, "../../uploads");

mkdirSync(path.join(uploadsDirectory, "avatars"), { recursive: true });

const extensionByMimeType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!extensionByMimeType[file.mimetype]) {
            callback(new ApiError(400, "Profile photo must be a JPEG, PNG, or WebP image."));
            return;
        }
        callback(null, true);
    },
});

export const uploadAvatar = (req: Request, res: Response, next: NextFunction) => {
    upload.single("avatar")(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError) {
            const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            const message =
                error.code === "LIMIT_FILE_SIZE"
                    ? "Profile photo must be 5 MB or smaller."
                    : "Unable to upload profile photo.";
            next(new ApiError(statusCode, message));
            return;
        }
        next(error);
    });
};
