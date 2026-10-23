import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image", "file", "audio"], default: "text" },
    text: { type: String, trim: true, maxlength: 4000 },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model("Message", messageSchema);
