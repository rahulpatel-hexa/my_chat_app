import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { getMe } from "./users.controller";

const router = Router();

router.get("/me", requireAuth, getMe);

export default router;
