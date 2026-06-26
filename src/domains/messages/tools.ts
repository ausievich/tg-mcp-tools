import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../../mcp/context.js";
import { buildFetchOptions, jsonResult, parseMinDate, wrapMessagesResponse } from "../../mcp/helpers.js";
import {
  getMessagesInput,
  getPostCommentsInput,
  getRecentFromChannelsInput,
  getRecentFromFolderInput,
  searchInFolderInput,
  searchMessagesInput,
} from "./schemas.js";
import {
  fetchMessages,
  fetchPostComments,
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
      inputSchema: getMessagesInput,
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
      inputSchema: getRecentFromFolderInput,
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
      inputSchema: getRecentFromChannelsInput,
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
      inputSchema: searchMessagesInput,
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
      inputSchema: searchInFolderInput,
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

  server.registerTool(
    "tg_get_post_comments",
    {
      description:
        "Returns comments on a channel post from its linked discussion group. Accepts a t.me post URL (e.g. https://t.me/channel/123) or channelId + messageId. Supports pagination via offsetId/offsetDate. Always cite the post url when summarizing for the user.",
      inputSchema: getPostCommentsInput,
    },
    async ({ postUrl, channelId, messageId, limit, offsetId, offsetDate, textOnly }) => {
      const client = await ctx.getClient();
      const result = await fetchPostComments(
        client,
        { postUrl, channelId, messageId },
        { limit, offsetId, offsetDate, textOnly },
      );
      return jsonResult(result);
    },
  );
}
