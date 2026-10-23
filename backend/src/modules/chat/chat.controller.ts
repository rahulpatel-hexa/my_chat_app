import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { getPublicAvatarUrl } from "../../utils/avatarUrl";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { createOrGetDirectConversation, getMyDirectConversations } from "./chat.service";

function getUserId(req: Request) {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    return userId;
}

function toListItem(
    conversation: Awaited<ReturnType<typeof createOrGetDirectConversation>>["conversation"],
    otherUser: Awaited<ReturnType<typeof createOrGetDirectConversation>>["otherUser"],
    myId: string,
    origin: string,
) {
    return {
        id: String(conversation._id),
        otherUser: {
            id: String(otherUser._id),
            name: otherUser.name,
            avatarUrl: getPublicAvatarUrl(otherUser.avatarUrl, origin),
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen,
        },
        lastMessage: conversation.lastMessage
            ? {
                text: conversation.lastMessage.text,
                senderId: String(conversation.lastMessage.senderId),
                createdAt: conversation.lastMessage.createdAt,
            }
            : null,
        unreadCount: conversation.unreadCounts.get(myId) ?? 0,
    };
}

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
    const myId = getUserId(req);
    const otherId = (req.body.userId as string).toLowerCase();
    if (myId.toLowerCase() === otherId) {
        throw new ApiError(400, "You cannot start a conversation with yourself.");
    }

    const { conversation, otherUser } = await createOrGetDirectConversation(myId, otherId);
    res.json({
        success: true,
        conversation: toListItem(conversation, otherUser, myId, `${req.protocol}://${req.get("host")}`),
    });
});

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
    const myId = getUserId(req);
    const conversations = await getMyDirectConversations(myId);
    const origin = `${req.protocol}://${req.get("host")}`;

    res.json({
        success: true,
        conversations: conversations.map(({ conversation, otherUser }) =>
            toListItem(conversation, otherUser, myId, origin),
        ),
    });
});
