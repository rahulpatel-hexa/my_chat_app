import { z } from "zod";

export const createConversationSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "A valid userId is required."),
});
