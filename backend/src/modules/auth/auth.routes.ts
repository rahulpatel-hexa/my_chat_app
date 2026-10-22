import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { googleSignInLimiter, otpLimiter } from "../../middlewares/rateLimit";
import {
    googleSignInSchema,
    phoneLoginSchema,
    signupSchema,
    verifyEmailOtpSchema,
    verifyPhoneLoginOtpSchema,
    resendOtpSchema,
} from "./auth.schema";
import * as controller from "./auth.controller";

const router = Router();

router.post("/email/signup", otpLimiter, validate(signupSchema), controller.signup);
router.post("/email/verify-otp", otpLimiter, validate(verifyEmailOtpSchema), controller.verifyEmailOtp);
router.post("/phone/login", otpLimiter, validate(phoneLoginSchema), controller.requestPhoneLoginOtp);
router.post("/phone/verify-otp", otpLimiter, validate(verifyPhoneLoginOtpSchema), controller.verifyPhoneLoginOtp);
router.post("/google", googleSignInLimiter, validate(googleSignInSchema), controller.googleSignIn);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

router.post("/resend-otp", otpLimiter, validate(resendOtpSchema), controller.resendOtp);

export default router;