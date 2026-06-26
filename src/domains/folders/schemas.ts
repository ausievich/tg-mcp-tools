import { z } from "zod";
import { folderSchema } from "../../mcp/schemas.js";

export const createFolderInput = {
  name: z
    .string()
    .min(1)
    .max(12)
    .describe("Folder name (max 12 UTF-8 characters, Telegram limit)"),
  includeChannels: z
    .array(z.string().min(1))
    .max(100)
    .optional()
    .describe("Channels/groups to include (@username or numeric id)"),
  excludeChannels: z
    .array(z.string().min(1))
    .max(100)
    .optional()
    .describe("Channels/groups to exclude (@username or numeric id)"),
  emoticon: z.string().optional().describe("Folder icon emoji (e.g. ✈️)"),
  includeAllBroadcasts: z.boolean().optional().describe("Auto-include all channels"),
  includeAllGroups: z.boolean().optional().describe("Auto-include all groups"),
  includeAllContacts: z.boolean().optional(),
  includeAllNonContacts: z.boolean().optional(),
  includeAllBots: z.boolean().optional(),
  excludeMuted: z.boolean().optional(),
  excludeRead: z.boolean().optional(),
  excludeArchived: z.boolean().optional(),
};

export const editFolderInput = {
  folder: folderSchema,
  name: z
    .string()
    .min(1)
    .max(12)
    .optional()
    .describe("New folder name (max 12 UTF-8 characters)"),
  includeChannels: z
    .array(z.string().min(1))
    .max(100)
    .optional()
    .describe("Channels/groups to include (@username or numeric id); replaces current list"),
  emoticon: z.string().optional().describe("Folder icon emoji"),
};
