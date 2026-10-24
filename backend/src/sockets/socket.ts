import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { frontendOrigin } from "../config/cors";
import { Conversation } from "../models/Conversation";
import { User } from "../models/User";
import { verifyAccessToken } from "../services/token.service";

let io: Server | undefined;
const connectedSocketsByUser = new Map<string, number>();

export const getConversationRoom = (conversationId: string): string =>
  `conversation:${conversationId.toLowerCase()}`;

const getUserRoom = (userId: string): string => `user:${userId}`;

const broadcastPresence = async (userId: string, isOnline: boolean, lastSeen: Date | null) => {
  if (!io) return;

  const participantIds = await Conversation.distinct("participants", { participants: userId });
  const recipientRooms = participantIds
    .map(String)
    .filter((participantId) => participantId !== userId)
    .map(getUserRoom);

  if (recipientRooms.length) {
    io.to(recipientRooms).emit("presence:update", { userId, isOnline, lastSeen });
  }
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: frontendOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      socket.data.userId = verifyAccessToken(token).sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.data.userId);
    const existingConnections = connectedSocketsByUser.get(userId) ?? 0;
    connectedSocketsByUser.set(userId, existingConnections + 1);
    void socket.join(getUserRoom(userId));

    if (existingConnections === 0) {
      void User.updateOne({ _id: userId }, { $set: { isOnline: true } })
        .exec()
        .then(() => broadcastPresence(userId, true, null))
        .catch((error: unknown) => console.error("Failed to set user online:", error));
    }

    console.log(`Socket connected: ${socket.id}`);

    socket.on(
      "conversation:join",
      async (
        payload: unknown,
        acknowledge?: (
          response:
            | { success: true; conversationId: string }
            | { success: false; error: string },
        ) => void,
      ) => {
        const conversationId =
          typeof payload === "object" && payload !== null && "conversationId" in payload
            ? payload.conversationId
            : undefined;
        if (typeof conversationId !== "string" || !/^[0-9a-fA-F]{24}$/.test(conversationId)) {
          acknowledge?.({ success: false, error: "A valid conversation ID is required." });
          if (!acknowledge) {
            socket.emit("conversation:join-result", {
              success: false,
              error: "A valid conversation ID is required.",
            });
          }
          return;
        }

        const normalizedId = conversationId.toLowerCase();
        try {
          const conversation = await Conversation.findOne({
            _id: normalizedId,
            participants: socket.data.userId,
          })
            .select("_id")
            .exec();

          if (!conversation) {
            const response = { success: false as const, error: "Conversation not found or access denied." };
            acknowledge?.(response);
            if (!acknowledge) socket.emit("conversation:join-result", response);
            return;
          }

          await socket.join(getConversationRoom(normalizedId));
          const response = { success: true as const, conversationId: normalizedId };
          acknowledge?.(response);
          if (!acknowledge) socket.emit("conversation:join-result", response);
        } catch (error) {
          console.error("Failed to join conversation room:", error);
          const response = { success: false as const, error: "Unable to join conversation." };
          acknowledge?.(response);
          if (!acknowledge) socket.emit("conversation:join-result", response);
        }
      },
    );

    socket.on("conversation:leave", (payload: unknown) => {
      const conversationId =
        typeof payload === "object" && payload !== null && "conversationId" in payload
          ? payload.conversationId
          : undefined;
      if (typeof conversationId !== "string" || !/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        return;
      }

      void socket.leave(getConversationRoom(conversationId));
    });

    socket.on("disconnect", () => {
      const activeConnections = connectedSocketsByUser.get(userId) ?? 0;
      if (activeConnections <= 1) {
        connectedSocketsByUser.delete(userId);
        const lastSeen = new Date();
        void User.updateOne(
          { _id: userId },
          { $set: { isOnline: false, lastSeen } },
        )
          .exec()
          .then(async () => {
            if (connectedSocketsByUser.has(userId)) {
              await User.updateOne({ _id: userId }, { $set: { isOnline: true } }).exec();
              return;
            }
            await broadcastPresence(userId, false, lastSeen);
          })
          .catch((error: unknown) => console.error("Failed to set user offline:", error));
      } else {
        connectedSocketsByUser.set(userId, activeConnections - 1);
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }
  return io;
};
