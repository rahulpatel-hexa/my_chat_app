import { Request, Response } from "express";
import { User } from "../../models/User";
import { AuthRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPublicAvatarUrl } from "../../utils/avatarUrl";
import { uploadsDirectory } from "../../middlewares/uploadAvatar";
import { unlink } from "node:fs/promises";
import path from "node:path";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findOne({ _id: userId, status: "active" })
        .select("name email phone avatarUrl about")
        .exec();

    if (!user) {
        throw new ApiError(401, "Account is unavailable.");
    }

    res.json({
        success: true,
        user: {
            id: String(user._id),
            name: user.name,
            email: user.email ?? null,
            phone: user.phone ?? null,
            avatarUrl: getPublicAvatarUrl(user.avatarUrl, `${req.protocol}://${req.get("host")}`),
            about: user.about,
        },
    });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const about = typeof req.body.about === "string" ? req.body.about.trim() : "";
    if (name.length < 2 || name.length > 50) {
        await removeUploadedAvatar(req.file?.path);
        throw new ApiError(400, "Name must be between 2 and 50 characters.");
    }
    if (about.length > 140) {
        await removeUploadedAvatar(req.file?.path);
        throw new ApiError(400, "About must be 140 characters or fewer.");
    }

    const user = await User.findOne({ _id: userId, status: "active" });
    if (!user) {
        await removeUploadedAvatar(req.file?.path);
        throw new ApiError(401, "Account is unavailable.");
    }

    const previousAvatarUrl = user.avatarUrl;
    user.name = name;
    user.about = about || "Hey there!";
    if (req.file) {
        user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }
    user.isProfileComplete = true;
    try {
        await user.save();
    } catch (error) {
        await removeUploadedAvatar(req.file?.path);
        throw error;
    }

    if (req.file && previousAvatarUrl?.startsWith("/uploads/avatars/")) {
        const previousAvatarPath = path.resolve(uploadsDirectory, previousAvatarUrl.slice("/uploads/".length));
        if (previousAvatarPath.startsWith(`${uploadsDirectory}${path.sep}`)) {
            await unlink(previousAvatarPath).catch((error: NodeJS.ErrnoException) => {
                if (error.code !== "ENOENT") throw error;
            });
        }
    }

    res.json({
        success: true,
        user: {
            id: String(user._id),
            name: user.name,
            email: user.email ?? null,
            phone: user.phone ?? null,
            avatarUrl: getPublicAvatarUrl(user.avatarUrl, `${req.protocol}://${req.get("host")}`),
            about: user.about,
        },
    });
});

const removeUploadedAvatar = async (filePath?: string) => {
    if (!filePath) return;
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
    });
};
