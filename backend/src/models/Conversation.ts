import { Schema, model } from "mongoose";

const lastMessageSchema = new Schema(
  {
    text: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    type: { type: String, enum: ["direct", "group"], default: "direct" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    directKey: { type: String, unique: true, sparse: true },
    lastMessage: { type: lastMessageSchema, default: undefined },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = model("Conversation", conversationSchema);
