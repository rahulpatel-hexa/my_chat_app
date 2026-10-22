import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Types } from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";
import { User } from "../../models/User";
import { Otp } from "../../models/Otp";
import { ApiError } from "../../utils/ApiError";
import { sendOtpEmail } from "../../services/email.service";
import { sendOtpSms } from "../../services/sms.service";
import { createSession, signAccessToken } from "../../services/token.service";


const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;
const googleOAuthClient = new OAuth2Client();

// 6 digit secure random OTP
const generateOtp = (): string => crypto.randomInt(100000, 1000000).toString();

const requestProfileChangeOtp = async (
    identifier: string,
    purpose: "change_email" | "change_phone",
    channel: "email" | "phone",
    userId: string,
) => {
    const existingOtp = await Otp.findOne({ identifier, purpose });
    if (existingOtp) {
        const elapsed = Date.now() - existingOtp.lastSentAt.getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
            const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
            throw new ApiError(429, `Please wait ${wait} seconds before requesting another OTP.`);
        }
    }

    const otp = generateOtp();
    await Otp.findOneAndUpdate(
        { identifier, purpose },
        {
            channel,
            otpHash: await bcrypt.hash(otp, 10),
            attempts: 0,
            resendCount: 0,
            lastSentAt: new Date(),
            expiresAt: new Date(Date.now() + env.otpExpiresMin * 60 * 1000),
            ownerUserId: userId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
        await (channel === "email" ? sendOtpEmail(identifier, otp) : sendOtpSms(identifier, otp));
    } catch (error) {
        await Otp.deleteOne({ identifier, purpose, ownerUserId: userId });
        throw error;
    }
};

const verifyProfileChangeOtp = async (
    identifier: string,
    otp: string,
    purpose: "change_email" | "change_phone",
    userId: string,
) => {
    const record = await Otp.findOne({ identifier, purpose, ownerUserId: userId });
    if (!record || record.expiresAt.getTime() <= Date.now()) {
        throw new ApiError(400, "OTP expired. Please request a new one.");
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        throw new ApiError(429, "Too many wrong attempts. Request a new OTP.");
    }

    if (!(await bcrypt.compare(otp, record.otpHash))) {
        record.attempts += 1;
        await record.save();
        throw new ApiError(400, "Invalid OTP.");
    }

    const user = await User.findOne({ _id: userId, status: "active" });
    if (!user) {
        throw new ApiError(401, "Account is unavailable.");
    }

    if (purpose === "change_email") {
        user.email = identifier;
        user.isEmailVerified = true;
        if (!user.authProviders.includes("email")) {
            user.authProviders.push("email");
        }
    } else {
        user.phone = identifier;
        user.isPhoneVerified = true;
        if (!user.authProviders.includes("phone")) {
            user.authProviders.push("phone");
        }
    }

    try {
        await user.save();
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new ApiError(
                409,
                purpose === "change_email"
                    ? "This email is already linked to another account."
                    : "This phone number is already linked to another account.",
            );
        }
        throw error;
    }

    await record.deleteOne();
    return user;
};

export const requestProfileEmailOtp = async (email: string, userId: string) => {
    const userWithEmail = await User.findOne({ email }).select("_id").lean();
    if (userWithEmail && String(userWithEmail._id) !== userId) {
        throw new ApiError(409, "This email is already linked to another account.");
    }
    await requestProfileChangeOtp(email, "change_email", "email", userId);
};

export const verifyProfileEmailOtp = (email: string, otp: string, userId: string) =>
    verifyProfileChangeOtp(email, otp, "change_email", userId);

export const requestProfilePhoneOtp = async (phone: string, userId: string) => {
    const userWithPhone = await User.findOne({ phone }).select("_id").lean();
    if (userWithPhone && String(userWithPhone._id) !== userId) {
        throw new ApiError(409, "This phone number is already linked to another account.");
    }
    await requestProfileChangeOtp(phone, "change_phone", "phone", userId);
};

export const verifyProfilePhoneOtp = (phone: string, otp: string, userId: string) =>
    verifyProfileChangeOtp(phone, otp, "change_phone", userId);

const isDuplicateKeyError = (error: unknown): boolean =>
    Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);

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

export const requestPhoneLoginOtp = async (phone: string): Promise<"login" | "signup"> => {
    const user = await User.findOne({ phone });
    if (user?.status === "blocked") {
        throw new ApiError(403, "Account is unavailable.");
    }
    const purpose = user ? "login" : "signup";

    const existingOtp = await Otp.findOne({ identifier: phone, purpose });
    if (existingOtp) {
        const elapsed = Date.now() - existingOtp.lastSentAt.getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
            const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
            throw new ApiError(429, `Please wait ${wait} seconds before requesting another OTP.`);
        }
    }

    const otp = generateOtp();
    await Otp.findOneAndUpdate(
        { identifier: phone, purpose },
        {
            channel: "phone",
            otpHash: await bcrypt.hash(otp, 10),
            attempts: 0,
            resendCount: 0,
            lastSentAt: new Date(),
            expiresAt: new Date(Date.now() + env.otpExpiresMin * 60 * 1000),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await sendOtpSms(phone, otp);
    return purpose;
};

export const verifyPhoneLoginOtp = async (
    phone: string,
    otp: string,
    purpose: "login" | "signup",
    meta: { userAgent?: string; ip?: string },
) => {
    const record = await Otp.findOne({ identifier: phone, purpose, channel: "phone" });
    if (!record || record.expiresAt.getTime() <= Date.now()) {
        throw new ApiError(400, "OTP expired. Please request a new one.");
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        throw new ApiError(429, "Too many wrong attempts. Request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
        record.attempts += 1;
        await record.save();
        throw new ApiError(400, "Invalid OTP.");
    }

    let user = await User.findOne({ phone });
    let isNewUser = false;
    if (user?.status === "blocked") {
        throw new ApiError(403, "Account is unavailable.");
    }
    if (!user && purpose === "signup") {
        user = await User.create({
            name: "New User",
            phone,
            isPhoneVerified: true,
            authProviders: ["phone"],
            isProfileComplete: false,
        });
        isNewUser = true;
    }
    if (!user) {
        await record.deleteOne();
        throw new ApiError(401, "Account is unavailable.");
    }
    if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
    }
    if (!user.authProviders.includes("phone")) {
        user.authProviders.push("phone");
    }
    if (user.isModified()) {
        await user.save();
    }

    await record.deleteOne();
    const accessToken = signAccessToken(String(user._id));
    const refreshToken = await createSession(user._id as Types.ObjectId, meta);

    return { user, accessToken, refreshToken, isNewUser };
};

export const signInWithGoogle = async (
    credential: string,
    meta: { userAgent?: string; ip?: string }
) => {
    const clientId = env.googleClientId;
    if (!clientId) {
        throw new ApiError(503, "Google sign-in is not configured on the server.");
    }

    let payload;
    try {
        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        payload = ticket.getPayload();
    } catch {
        throw new ApiError(401, "Google credential is invalid or expired.");
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new ApiError(401, "Google account must have a verified email address.");
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
        user = await User.findOne({ email });

        if (user) {
            if (user.googleId && user.googleId !== payload.sub) {
                throw new ApiError(409, "This email is linked to a different Google account.");
            }

            user.googleId = payload.sub;
            user.isEmailVerified = true;
            if (!user.authProviders.includes("google")) {
                user.authProviders.push("google");
            }
            if (!user.avatarUrl && payload.picture) {
                user.avatarUrl = payload.picture;
            }
            await user.save();
        } else {
            user = await User.create({
                name: payload.name?.trim() || payload.given_name?.trim() || email.split("@")[0],
                email,
                googleId: payload.sub,
                avatarUrl: payload.picture,
                isEmailVerified: true,
                authProviders: ["google"],
                isProfileComplete: true,
            });
            isNewUser = true;
        }
    }

    if (user.status !== "active") {
        throw new ApiError(403, "Account is unavailable.");
    }

    const accessToken = signAccessToken(String(user._id));
    const refreshToken = await createSession(user._id as Types.ObjectId, meta);

    return { user, accessToken, refreshToken, isNewUser };
};

const deliverOtp = async (channel: "email" | "phone", identifier: string, otp: string) => {
  if (channel === "email") return sendOtpEmail(identifier, otp);
  return sendOtpSms(identifier, otp);
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