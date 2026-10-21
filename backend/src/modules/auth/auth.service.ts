import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Types } from "mongoose";
import { env } from "../../config/env";
import { User } from "../../models/User";
import { Otp } from "../../models/Otp";
import { ApiError } from "../../utils/ApiError";
import { sendOtpEmail } from "../../services/email.service";
import { createSession, signAccessToken } from "../../services/token.service";


const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

// 6 digit secure random OTP
const generateOtp = (): string => crypto.randomInt(100000, 1000000).toString();

// Send OTP
export const requestSignupOtp = async (name: string, email: string) => {
    const existing = await User.findOne({ email });
    if (existing) {
        throw new ApiError(409, "Email already registered. Please login.");
    }

    const old = await Otp.findOne({ identifier: email, purpose: "signup" });
    if (old && Date.now() - old.lastSentAt.getDate() < RESEND_COOLDOWN_MS) {
        throw new ApiError(429, "Please wait 30 seconds before requesting a new OTP");
    }

    const otp = generateOtp();
    await Otp.findOneAndUpdate(
        { identifier: email, purpose: "signup" },
        {
            channel: "email",
            otpHash: await bcrypt.hash(otp, 10),
            attempts: 0,
            lastSentAt: new Date(),
            expiresAt: new Date(Date.now() + env.otpExpiresMin * 60 * 1000),
            pendingData: { name },
        },
        { upsert: true }
    );

    await sendOtpEmail(email, otp);
};


export const verifySignupOtp = async (
    email: string,
    otp: string,
    meta: { userAgent?: string; ip?: string }
) => {
    const record = await Otp.findOne({ identifier: email, purpose: "signup" });
    if (!record) throw new ApiError(400, "OTP expired. Please request a new one.");
    if (record.attempts >= MAX_ATTEMPTS) {
        throw new ApiError(429, "Too many wrong attempts. Request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
        record.attempts += 1;
        await record.save();
        throw new ApiError(400, "Invalid OTP");
    }

    const user = await User.create({
        name: record.pendingData?.name,
        email,
        isEmailVerified: true,
        authProviders: ["email"],
        isProfileComplete: true,
    });

    await record.deleteOne();

    const accessToken = signAccessToken(String(user._id));
    const refreshToken = await createSession(user._id as Types.ObjectId, meta);

    return { user, accessToken, refreshToken };
};

const deliverOtp = async (channel: "email" | "phone", identifier: string, otp: string) => {
  if (channel === "email") return sendOtpEmail(identifier, otp);
  // phone: sms.service baad mein add hogi
  console.log(`[DEV] SMS OTP for ${identifier}: ${otp}`);
};

export const resendOtp = async (
  identifier: string,
  purpose: "signup" | "login" | "add_phone"
) => {
  const record = await Otp.findOne({ identifier, purpose });
  if (!record) {
    throw new ApiError(400, "No active OTP request. Please start again.");
  }

  // 1) Cooldown check
  const elapsed = Date.now() - record.lastSentAt.getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    throw new ApiError(429, `Please wait ${wait} seconds before resending`);
  }

  // 2) Max resend limit
  if (record.resendCount >= MAX_RESENDS) {
    throw new ApiError(429, "Resend limit reached. Please try again later.");
  }

  // 3) Naya OTP
  const otp = generateOtp();
  record.otpHash = await bcrypt.hash(otp, 10);
  record.attempts = 0; // naya OTP, attempts reset
  record.resendCount += 1;
  record.lastSentAt = new Date();
  record.expiresAt = new Date(Date.now() + env.otpExpiresMin * 60 * 1000);
  await record.save();

  await deliverOtp(record.channel, identifier, otp);
};