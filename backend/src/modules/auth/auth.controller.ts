import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { env } from "../../config/env";
import * as authService from "./auth.service";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";
import { revokeSession, rotateSession, signAccessToken } from "../../services/token.service";

const refreshCookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax" as const,
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
};

const clearRefreshCookie = (res: Response) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        path: "/api/v1/auth",
    });
};

export const signup = asyncHandler(
    async (req: Request, res: Response) => {
        const { name, email } = req.body;
        await authService.requestSignupOtp(name, email);
        res.json({ success: true, message: "OTP sent to your email" });
    }
);

// No need to use asyncHandler into express verison 5
export const verifyEmailOtp = 
// asyncHandler(
    async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const { user, accessToken, refreshToken } = await authService.verifySignupOtp(email, otp, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });

    // refresh token cookie 
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(201).json({
        success: true,
        accessToken,
        isNewUser: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            avatarUrl: user.avatarUrl ?? null,
            about: user.about,
        },
    });
}
// );

export const requestPhoneLoginOtp = asyncHandler(async (req: Request, res: Response) => {
    const purpose = await authService.requestPhoneLoginOtp(req.body.phone);
    res.json({ success: true, message: "OTP sent to your phone.", purpose });
});

export const verifyPhoneLoginOtp = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken, isNewUser } = await authService.verifyPhoneLoginOtp(
        req.body.phone,
        req.body.otp,
        req.body.purpose,
        {
            userAgent: req.headers["user-agent"],
            ip: req.ip,
        },
    );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    res.json({
        success: true,
        accessToken,
        isNewUser,
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

export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken, isNewUser } = await authService.signInWithGoogle(
        req.body.credential,
        {
            userAgent: req.headers["user-agent"],
            ip: req.ip,
        },
    );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    res.json({
        success: true,
        accessToken,
        isNewUser,
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

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, purpose } = req.body;
  await authService.resendOtp(identifier, purpose);
  res.json({ success: true, message: "OTP resent successfully" });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const currentRefreshToken = req.cookies?.refreshToken;
    if (typeof currentRefreshToken !== "string") {
        throw new ApiError(401, "Session expired. Please sign in again.");
    }

    const rotated = await rotateSession(currentRefreshToken, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });

    if (!rotated) {
        clearRefreshCookie(res);
        throw new ApiError(401, "Session expired. Please sign in again.");
    }

    const user = await User.findOne({ _id: rotated.session.userId, status: "active" });
    if (!user) {
        await revokeSession(rotated.refreshToken);
        clearRefreshCookie(res);
        throw new ApiError(401, "Account is unavailable.");
    }

    res.cookie("refreshToken", rotated.refreshToken, refreshCookieOptions);
    res.json({
        success: true,
        accessToken: signAccessToken(String(user._id)),
        user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            avatarUrl: user.avatarUrl ?? null,
            about: user.about,
        },
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (typeof refreshToken === "string") {
        await revokeSession(refreshToken);
    }
    clearRefreshCookie(res);
    res.status(204).json({ success: true, message: "Logged out" });
});
