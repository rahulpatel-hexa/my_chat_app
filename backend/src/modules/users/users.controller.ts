import { Request, Response } from "express";
import { User } from "../../models/User";
import { AuthRequest } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";

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
            avatarUrl: user.avatarUrl ?? null,
            about: user.about,
        },
    });
});
