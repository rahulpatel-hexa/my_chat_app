import { Conversation } from "../../models/Conversation";
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
