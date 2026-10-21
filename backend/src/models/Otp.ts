import { Schema, model } from "mongoose";

const otpSchema = new Schema(
  {
    identifier: { type: String, required: true },
    channel: { type: String, enum: ["phone", "email"], required: true },
    purpose: { type: String, enum: ["login", "signup", "add_phone"], required: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    pendingData: { name: String },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // expire hone par auto-delete
otpSchema.index({ identifier: 1, purpose: 1 }, { unique: true });

export const Otp = model("Otp", otpSchema);