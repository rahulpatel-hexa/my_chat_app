import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { frontendOrigin } from "./config/cors";
import { uploadsDirectory } from "./middlewares/uploadAvatar";
import authRoutes from "./modules/auth/auth.routes"
import chatRoutes from "./modules/chat/chat.routes";
import usersRoutes from "./modules/users/users.routes";
import { errorHandler } from "./middlewares/error";

const app = express();

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDirectory));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/conversations", chatRoutes);
app.use("/api/v1/users", usersRoutes);

app.get("/", (_req, res) => {
  res.send("Chat app backend is running");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use(errorHandler);

export default app;
