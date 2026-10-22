import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { uploadAvatar } from "../../middlewares/uploadAvatar";
import { getMe, updateProfile } from "./users.controller";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, uploadAvatar, updateProfile);

export default router;
