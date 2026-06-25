import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { buildFetchOptions, jsonResult, parseMinDate, wrapMessagesResponse } from "../../mcp/helpers.js";
import { folderSchema, maxDateSchema, minDateSchema } from "../../mcp/schemas.js";
import {
  fetchMessages,
  fetchRecentFromChannels,
  fetchRecentFromFolder,
  searchMessagesInChat,
  searchMessagesInFolder,
} from "./service.js";

export function registerMessageTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_get_messages",
    {
      description:
        "Returns recent messages from a single channel or chat. Supports pagination via beforeMessageId and date filters via sinceHours or minDate. Each message includes a `url` field linking to the original Telegram post — always cite these links when summarizing for the user.",
      inputSchema: {
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
        minDate: minDateSchema,
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
      },
    },
    async ({ channelId, limit, sinceHours, minDate, beforeMessageId, beforeMessageDate }) => {
      const client = await ctx.getClient();
      const messages = await fetchMessages(
        client,
        channelId,
        limit ?? 20,
        buildFetchOptions({ sinceHours, minDate, beforeMessageId, beforeMessageDate }),
      );
      return jsonResult(wrapMessagesResponse(messages));
    },
  );

  server.registerTool(
    "tg_get_recent_from_folder",
    {
      description:
        "Fetches recent messages from all channels and groups in a Telegram folder, sorted by date descending. Each message includes a `url` field — always cite source links when summarizing for the user.",
      inputSchema: {
        folder: folderSchema,
        sinceHours: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Last N hours (default 24; optional, combine with minDate)"),
        minDate: minDateSchema,
        limitPerChannel: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Max messages per channel (default 50, max 100)"),
      },
    },
    async ({ folder, sinceHours, minDate, limitPerChannel }) => {
      const client = await ctx.getClient();
      const messages = await fetchRecentFromFolder(
        client,
        folder,
        buildFetchOptions({ sinceHours, minDate, defaultSinceHours: 24 }),
        limitPerChannel ?? 50,
      );
      return jsonResult(messages);
    },
  );

  server.registerTool(
    "tg_get_recent_from_channels",
    {
      description:
        "Fetches messages from multiple channels at once and returns them sorted by date descending. Each message includes a `url` field — always cite source links when summarizing for the user.",
      inputSchema: {
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
        minDate: minDateSchema,
        limitPerChannel: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Max messages per channel (default 50, max 100)"),
      },
    },
    async ({ channelIds, sinceHours, minDate, limitPerChannel }) => {
      const client = await ctx.getClient();
      const messages = await fetchRecentFromChannels(
        client,
        channelIds,
        buildFetchOptions({ sinceHours, minDate, defaultSinceHours: 24 }),
        limitPerChannel ?? 50,
      );
      return jsonResult(messages);
    },
  );

  server.registerTool(
    "tg_search_messages",
    {
      description:
        "Search messages by text in a single channel or group. Uses Telegram's built-in search — works across full chat history, not just recent posts. Each message includes a `url` field — always cite source links when summarizing for the user.",
      inputSchema: {
        channelId: z
          .string()
          .min(1)
          .describe("Numeric ID or @username of the channel or chat"),
        query: z
          .string()
          .min(1)
          .describe("Text to search for (e.g. невролог, neurologist)"),
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
        minDate: minDateSchema,
        maxDate: maxDateSchema,
      },
    },
    async ({ channelId, query, limit, offset, minDate, maxDate }) => {
      const client = await ctx.getClient();
      const result = await searchMessagesInChat(client, channelId, {
        query,
        limit: limit ?? 50,
        offset,
        minDate: parseMinDate(minDate),
        maxDate: maxDate ? parseMinDate(maxDate) : undefined,
      });

      return jsonResult(result);
    },
  );

  server.registerTool(
    "tg_search_in_folder",
    {
      description:
        "Search messages by text across all channels and groups in a Telegram folder. Results are merged and sorted by date descending. Each message includes a `url` field — always cite source links when summarizing for the user.",
      inputSchema: {
        folder: folderSchema,
        query: z
          .string()
          .min(1)
          .describe("Text to search for (e.g. невролог, neurologist)"),
        limitPerChannel: z
          .number()
          .int()
          .positive()
          .max(50)
          .optional()
          .describe("Max results per channel (default 20, max 50)"),
        minDate: minDateSchema,
        maxDate: maxDateSchema,
      },
    },
    async ({ folder, query, limitPerChannel, minDate, maxDate }) => {
      const client = await ctx.getClient();
      const result = await searchMessagesInFolder(
        client,
        folder,
        {
          query,
          minDate: parseMinDate(minDate),
          maxDate: maxDate ? parseMinDate(maxDate) : undefined,
        },
        limitPerChannel ?? 20,
      );

      return jsonResult(result);
    },
  );
}
