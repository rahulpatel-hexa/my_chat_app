import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createConversation, getConversations } from "./chat.controller";
import { createConversationSchema } from "./chat.schema";

const router = Router();

router.use(requireAuth);
router.post("/", validate(createConversationSchema), createConversation);
router.get("/", getConversations);

export default router;
