import { z } from "zod";
import { folderSchema } from "../../mcp/schemas.js";

export const createChannelInput = {
  title: z.string().min(1).max(255).describe("Channel title"),
  description: z
    .string()
    .max(255)
    .optional()
    .describe("Channel description (about)"),
};

export const setChannelTitleInput = {
  channelId: z
    .string()
    .min(1)
    .describe("Numeric ID or @username of the channel or group"),
  title: z.string().min(1).max(255).describe("New title"),
};

export const joinChannelInput = {
  channelId: z
    .string()
    .min(1)
    .describe("Channel @username, numeric id, or invite link (https://t.me/...)"),
};

export const leaveChannelInput = {
  channelId: z
    .string()
    .min(1)
    .describe("Channel or group @username or numeric id"),
  clearHistory: z
    .boolean()
    .optional()
    .describe("Clear chat history after leaving (legacy group chats only)"),
};

export const getSimilarChannelsInput = {
  channelId: z
    .string()
    .min(1)
    .optional()
    .describe("Numeric ID or @username of a channel to find similar channels for"),
  folder: folderSchema
    .optional()
    .describe(
      "Folder id or name — recommendations are collected from all channels in the folder and deduplicated",
    ),
};

export const searchChannelsInput = {
  query: z
    .string()
    .min(1)
    .describe("Search query (e.g. NFT gifts, fragment, tonkeeper)"),
  limit: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe("Max channels to return (default 20, max 50)"),
  mode: z
    .enum(["name", "posts", "both"])
    .optional()
    .describe(
      "name — match channel title/username; posts — channels with matching public posts; both — merge (default)",
    ),
};
