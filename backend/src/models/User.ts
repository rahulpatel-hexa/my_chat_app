import { Schema, model } from "mongoose";

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
        phone: { type: String, unique: true, sparse: true },
        googleId: { type: String, unique: true, sparse: true },
        avatarUrl: String,
        about: { type: String, default: "Hey there!" },
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: false },
        authProviders: [{ type: String, enum: ["phone", "email", "google"] }],
        isProfileComplete: { type: Boolean, default: false },
        phonePromptSkippedAt: Date,
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
        status: { type: String, enum: ["active", "blocked"], default: "active" },
        blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

export const User = model("User", userSchema);