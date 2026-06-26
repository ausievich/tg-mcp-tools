import { z } from "zod";
import { folderSchema } from "../../mcp/schemas.js";

export const getMessagesInput = {
  channelId: z
    .string()
    .min(1)
    .describe("Numeric ID or @username of the channel or chat"),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Messages to fetch (default 20, max 100)"),
  sinceHours: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Only messages from last N hours (optional; combine with minDate)"),
  minDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or after this date (ISO 8601, e.g. 2024-06-01 or 2024-06-01T00:00:00Z)"),
  beforeMessageId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Return messages older than this message id (pagination)"),
  beforeMessageDate: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(
      "Unix timestamp (seconds) of beforeMessageId from previous page's nextBeforeMessageDate",
    ),
};

export const getRecentFromFolderInput = {
  folder: folderSchema,
  sinceHours: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Last N hours (default 24; optional, combine with minDate)"),
  minDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or after this date (ISO 8601, e.g. 2024-06-01 or 2024-06-01T00:00:00Z)"),
  limitPerChannel: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Max messages per channel (default 50, max 100)"),
};

export const getRecentFromChannelsInput = {
  channelIds: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .describe("List of IDs or @usernames (max 50)"),
  sinceHours: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Last N hours (default 24; optional, combine with minDate)"),
  minDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or after this date (ISO 8601, e.g. 2024-06-01 or 2024-06-01T00:00:00Z)"),
  limitPerChannel: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Max messages per channel (default 50, max 100)"),
};

export const searchMessagesInput = {
  channelId: z
    .string()
    .min(1)
    .describe("Numeric ID or @username of the channel or chat"),
  query: z
    .string()
    .min(1)
    .describe("Text to search for (e.g. relocation, remote)"),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Max results (default 50, max 100)"),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Pagination offset (message id from previous page's nextOffset)"),
  minDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or after this date (ISO 8601, e.g. 2024-06-01 or 2024-06-01T00:00:00Z)"),
  maxDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or before this date (ISO 8601)"),
};

export const searchInFolderInput = {
  folder: folderSchema,
  query: z
    .string()
    .min(1)
    .describe("Text to search for (e.g. relocation, remote)"),
  limitPerChannel: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe("Max results per channel (default 20, max 50)"),
  minDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or after this date (ISO 8601, e.g. 2024-06-01 or 2024-06-01T00:00:00Z)"),
  maxDate: z
    .string()
    .min(1)
    .optional()
    .describe("Only messages on or before this date (ISO 8601)"),
};

export const getPostCommentsInput = {
  postUrl: z
    .string()
    .min(1)
    .optional()
    .describe("Telegram post URL (https://t.me/username/id or https://t.me/c/channelId/id)"),
  channelId: z
    .string()
    .min(1)
    .optional()
    .describe("Channel @username or numeric id (use with messageId if postUrl is omitted)"),
  messageId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Post message id (use with channelId if postUrl is omitted)"),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Comments to fetch per page (default 100, max 100)"),
  offsetId: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Pagination: message id from previous page's nextOffsetId"),
  offsetDate: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Pagination: unix timestamp from previous page's nextOffsetDate"),
  textOnly: z
    .boolean()
    .optional()
    .describe("Skip comments without text (stickers, media-only; default false)"),
};
