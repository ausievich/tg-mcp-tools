import { z } from "zod";
import { folderSchema } from "../../mcp/schemas.js";

export const getDialogsInput = {
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .describe("Max dialogs to return (default 100, max 500)"),
  folder: folderSchema.optional().describe("Folder id or name. Omit for all chats."),
};

export const channelIdsInput = {
  channelIds: z
    .array(z.string().min(1))
    .min(1)
    .max(100)
    .describe("List of @usernames or numeric ids"),
};
