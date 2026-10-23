import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createConversation, createMessage, getConversations, getMessages, markAsRead } from "./chat.controller";
import { createConversationSchema, createMessageSchema } from "./chat.schema";

const router = Router();

router.use(requireAuth);
router.post("/", validate(createConversationSchema), createConversation);
router.post("/:id/messages", validate(createMessageSchema), createMessage);
router.get("/:id/messages", getMessages);
router.patch("/:id/read", markAsRead);
router.get("/", getConversations);

export default router;
