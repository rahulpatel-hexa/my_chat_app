import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { uploadAvatar } from "../../middlewares/uploadAvatar";
import { otpLimiter } from "../../middlewares/rateLimit";
import { validate } from "../../middlewares/validate";
import {
    requestProfileEmailOtpSchema,
    requestProfilePhoneOtpSchema,
    verifyProfileEmailOtpSchema,
    verifyProfilePhoneOtpSchema,
} from "../auth/auth.schema";
import {
    getMe,
    requestEmailChangeOtp,
    requestPhoneChangeOtp,
    updateProfile,
    verifyEmailChangeOtp,
    verifyPhoneChangeOtp,
} from "./users.controller";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, uploadAvatar, updateProfile);
router.post("/me/email/request-otp", requireAuth, otpLimiter, validate(requestProfileEmailOtpSchema), requestEmailChangeOtp);
router.post("/me/email/verify-otp", requireAuth, otpLimiter, validate(verifyProfileEmailOtpSchema), verifyEmailChangeOtp);
router.post("/me/phone/request-otp", requireAuth, otpLimiter, validate(requestProfilePhoneOtpSchema), requestPhoneChangeOtp);
router.post("/me/phone/verify-otp", requireAuth, otpLimiter, validate(verifyProfilePhoneOtpSchema), verifyPhoneChangeOtp);

export default router;
