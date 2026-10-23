import { z } from "zod";

export const createConversationSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "A valid userId is required."),
});

export const createMessageSchema = z.object({
    text: z.string().trim().min(1).max(4000),
});

export const getMessagesQuerySchema = z.object({
    cursor: z.preprocess(
        (value) => value === "" ? undefined : value,
        z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Cursor must be a valid date.").optional(),
    ),
    limit: z.coerce.number().int().min(1).max(50).default(30),
});
