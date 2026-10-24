import { Conversation } from "../../models/Conversation";
import { Message } from "../../models/Message";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";

export const createOrGetDirectConversation = async (myId: string, otherId: string) => {
    const otherUser = await User.findOne({ _id: otherId, status: "active" })
        .select("name avatarUrl isOnline lastSeen")
        .exec();

    if (!otherUser) {
        throw new ApiError(404, "User not found.");
    }

    const directKey = [myId, otherId].sort().join("_");
    let conversation = await Conversation.findOne({ directKey }).exec();

    if (!conversation) {
        try {
            conversation = await Conversation.create({
                type: "direct",
                participants: [myId, otherId],
                directKey,
            });
        } catch (error) {
            if (
                typeof error !== "object" ||
                error === null ||
                !("code" in error) ||
                error.code !== 11000
            ) {
                throw error;
            }
            conversation = await Conversation.findOne({ directKey }).exec();
            if (!conversation) {
                throw error;
            }
        }
    }

    return { conversation, otherUser };
};

export const getMyDirectConversations = async (myId: string) => {
    const conversations = await Conversation.find({ participants: myId, type: "direct" })
        .sort({ updatedAt: -1 })
        .exec();

    const otherUserIds = [
        ...new Set(
            conversations
                .map((conversation) => conversation.participants.find((participant) => String(participant) !== myId))
                .filter((participant): participant is NonNullable<typeof participant> => participant !== undefined)
                .map(String),
        ),
    ];

    const otherUsers = await User.find({ _id: { $in: otherUserIds } })
        .select("name avatarUrl isOnline lastSeen")
        .exec();
    const otherUsersById = new Map(otherUsers.map((user) => [String(user._id), user]));

    return conversations.flatMap((conversation) => {
        const otherParticipant = conversation.participants.find((participant) => String(participant) !== myId);
        const otherUser = otherParticipant ? otherUsersById.get(String(otherParticipant)) : undefined;
        return otherUser ? [{ conversation, otherUser }] : [];
    });
};

export const createConversationMessage = async (conversationId: string, senderId: string, text: string) => {
    const conversation = await Conversation.findById(conversationId).exec();
    if (!conversation) {
        throw new ApiError(404, "Conversation not found.");
    }

    if (!conversation.participants.some((participant) => String(participant) === senderId)) {
        throw new ApiError(403, "You are not a participant in this conversation.");
    }

    const receiverIds = conversation.participants
        .filter((participant) => String(participant) !== senderId)
        .map(String);
    if (!receiverIds.length) {
        throw new ApiError(400, "Conversation has no other participants.");
    }

    const message = await Message.create({
        conversationId: conversation._id,
        senderId,
        text,
    });
    const unreadCounts = Object.fromEntries(receiverIds.map((receiverId) => [`unreadCounts.${receiverId}`, 1]));
    await Conversation.updateOne(
        { _id: conversation._id },
        {
            $set: {
                lastMessage: {
                    text: message.text,
                    senderId: message.senderId,
                    createdAt: message.createdAt,
                },
            },
            $inc: unreadCounts,
        },
    ).exec();

    return message;
};

export const getConversationMessages = async (
    conversationId: string,
    userId: string,
    cursor: Date | undefined,
    limit: number,
) => {
    const conversation = await Conversation.findById(conversationId).select("participants").exec();
    if (!conversation) {
        throw new ApiError(404, "Conversation not found.");
    }

    if (!conversation.participants.some((participant) => String(participant) === userId)) {
        throw new ApiError(403, "You are not a participant in this conversation.");
    }

    const query = Message.find({
        conversationId: conversation._id,
        deletedFor: { $nin: [userId] },
        ...(cursor ? { createdAt: { $lt: cursor } } : {}),
    })
        .sort({ createdAt: -1 })
        .limit(limit + 1);
    const results = await query.exec();
    const hasMore = results.length > limit;
    const messages = hasMore ? results.slice(0, limit) : results;

    return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1].createdAt.toISOString() : null,
    };
};

export const markConversationAsRead = async (conversationId: string, userId: string) => {
    const conversation = await Conversation.findById(conversationId).select("participants").exec();
    if (!conversation) {
        throw new ApiError(404, "Conversation not found.");
    }

    if (!conversation.participants.some((participant) => String(participant) === userId)) {
        throw new ApiError(403, "You are not a participant in this conversation.");
    }

    const unreadMessages = await Message.find({
        conversationId: conversation._id,
        senderId: { $ne: userId },
        status: { $ne: "read" },
        deletedFor: { $nin: [userId] },
    })
        .select("_id")
        .exec();
    const messageIds = unreadMessages.map((message) => String(message._id));

    await Promise.all([
        Message.updateMany(
            { _id: { $in: unreadMessages.map((message) => message._id) } },
            { $set: { status: "read" } },
        ).exec(),
        Conversation.updateOne(
            { _id: conversation._id },
            { $set: { [`unreadCounts.${userId}`]: 0 } },
        ).exec(),
    ]);

    return messageIds;
};
