import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { getPublicAvatarUrl } from "../../utils/avatarUrl";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    createConversationMessage,
    createOrGetDirectConversation,
    getConversationMessages,
    getMyDirectConversations,
} from "./chat.service";
import { getMessagesQuerySchema } from "./chat.schema";

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

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    const senderId = getUserId(req);
    const conversationId = req.params.id;
    if (typeof conversationId !== "string" || !/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        throw new ApiError(400, "A valid conversation ID is required.");
    }

    const message = await createConversationMessage(conversationId, senderId, req.body.text as string);
    res.status(201).json({
        success: true,
        message: {
            id: String(message._id),
            conversationId: String(message.conversationId),
            senderId: String(message.senderId),
            type: message.type,
            text: message.text,
            status: message.status,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        },
    });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const conversationId = req.params.id;
    if (typeof conversationId !== "string" || !/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        throw new ApiError(400, "A valid conversation ID is required.");
    }

    const query = getMessagesQuerySchema.safeParse(req.query);
    if (!query.success) {
        throw new ApiError(400, query.error.issues[0].message);
    }
    console.log('query', query)

    const { cursor, limit } = query.data;
    console.table({
        cursor,
        limit
    })
    const result = await getConversationMessages(
        conversationId,
        userId,
        cursor ? new Date(cursor) : undefined,
        limit,
    );

    res.json({
        success: true,
        messages: result.messages.map((message) => ({
            id: String(message._id),
            conversationId: String(message.conversationId),
            senderId: String(message.senderId),
            type: message.type,
            text: message.text,
            status: message.status,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        })),
        nextCursor: result.nextCursor,
    });
});
