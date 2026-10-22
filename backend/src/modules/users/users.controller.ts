import { Request, Response } from "express";
import { User } from "../../models/User";
import { AuthRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPublicAvatarUrl } from "../../utils/avatarUrl";
import { uploadsDirectory } from "../../middlewares/uploadAvatar";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { deleteCloudinaryAvatar, uploadAvatarToCloudinary } from "../../services/cloudinary.service";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findOne({ _id: userId, status: "active" })
        .select("name email phone avatarUrl about description")
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
            description: user.description ?? "",
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
    const hasDescription = typeof req.body.description === "string";
    const description = hasDescription ? req.body.description.trim() : "";
    if (name.length < 2 || name.length > 50) {
        throw new ApiError(400, "Name must be between 2 and 50 characters.");
    }
    if (about.length > 140) {
        throw new ApiError(400, "About must be 140 characters or fewer.");
    }
    if (hasDescription && description.length > 500) {
        throw new ApiError(400, "Description must be 500 characters or fewer.");
    }

    const user = await User.findOne({ _id: userId, status: "active" });
    if (!user) {
        throw new ApiError(401, "Account is unavailable.");
    }

    const previousAvatarUrl = user.avatarUrl;
    const previousAvatarPublicId = user.avatarPublicId;
    let uploadedAvatar: Awaited<ReturnType<typeof uploadAvatarToCloudinary>> | undefined;
    if (req.file) {
        if (!req.file.buffer) {
            throw new ApiError(400, "The uploaded profile photo is invalid.");
        }
        uploadedAvatar = await uploadAvatarToCloudinary(req.file.buffer, userId);
    }

    user.name = name;
    user.about = about || "Hey there!";
    if (hasDescription) {
        user.description = description;
    }
    if (uploadedAvatar) {
        user.avatarUrl = uploadedAvatar.secure_url;
        user.avatarPublicId = uploadedAvatar.public_id;
    }
    user.isProfileComplete = true;
    try {
        await user.save();
    } catch (error) {
        if (uploadedAvatar) {
            await deleteCloudinaryAvatar(uploadedAvatar.public_id).catch((cleanupError: unknown) => {
                console.error("Unable to clean up an unsaved Cloudinary avatar:", cleanupError);
            });
        }
        throw error;
    }

    if (uploadedAvatar && previousAvatarPublicId) {
        await deleteCloudinaryAvatar(previousAvatarPublicId).catch((error: unknown) => {
            console.error("Unable to delete replaced Cloudinary avatar:", error);
        });
    } else if (uploadedAvatar && previousAvatarUrl?.startsWith("/uploads/avatars/")) {
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
            description: user.description ?? "",
        },
    });
});
