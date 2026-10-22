import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const phoneLoginSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
});

export const verifyPhoneLoginOtpSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  purpose: z.enum(["login", "signup"]).default("login"),
});

export const googleSignInSchema = z.object({
  credential: z.string().trim().min(1, "Google credential is required").max(8192),
});

export const resendOtpSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(3, "Identifier is required"),
  purpose: z.enum(["signup", "login", "add_phone"]),
});