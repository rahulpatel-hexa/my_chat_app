import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { otpLimiter } from "../../middlewares/rateLimit";
import { signupSchema, verifyEmailOtpSchema, resendOtpSchema  } from "./auth.schema";
import * as controller from "./auth.controller";

const router = Router();

router.post("/email/signup", otpLimiter, validate(signupSchema), controller.signup);
router.post("/email/verify-otp", otpLimiter, validate(verifyEmailOtpSchema), controller.verifyEmailOtp);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

router.post("/resend-otp", otpLimiter, validate(resendOtpSchema), controller.resendOtp);

export default router;