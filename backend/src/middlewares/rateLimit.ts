import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 min
    max: 10,
    message: {
        success: false,
        message: "Too many requests, try again later"
    },
});

export const googleSignInLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many sign-in attempts. Please try again later."
    },
});