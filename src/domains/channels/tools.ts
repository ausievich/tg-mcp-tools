import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { folderSchema } from "../../mcp/schemas.js";
import {
  createBroadcastChannel,
  fetchSimilarChannels,
  joinChannel,
  leaveChannel,
  searchChannels,
  setChannelTitle,
} from "./service.js";

export function registerChannelTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_create_channel",
    {
      description: "Create a new Telegram broadcast channel owned by your account.",
      inputSchema: {
        title: z.string().min(1).max(255).describe("Channel title"),
        description: z
          .string()
          .max(255)
          .optional()
          .describe("Channel description (about)"),
      },
    },
    async ({ title, description }) => {
      const client = await ctx.getClient();
      const channel = await createBroadcastChannel(client, { title, description });
      return jsonResult(channel);
    },
  );

  server.registerTool(
    "tg_set_channel_title",
    {
      description:
        "Rename a Telegram channel or group. Requires admin rights with permission to change chat info.",
      inputSchema: {
        channelId: z
          .string()
          .min(1)
          .describe("Numeric ID or @username of the channel or group"),
        title: z.string().min(1).max(255).describe("New title"),
      },
    },
    async ({ channelId, title }) => {
      const client = await ctx.getClient();
      const channel = await setChannelTitle(client, channelId, title);
      return jsonResult(channel);
    },
  );

  server.registerTool(
    "tg_join_channel",
    {
      description:
        "Subscribe to a public Telegram channel or group, or request to join via invite link. Accepts @username, numeric id, or t.me link.",
      inputSchema: {
        channelId: z
          .string()
          .min(1)
          .describe("Channel @username, numeric id, or invite link (https://t.me/...)"),
      },
    },
    async ({ channelId }) => {
      const client = await ctx.getClient();
      const result = await joinChannel(client, channelId);
      return jsonResult(result);
    },
  );

  server.registerTool(
    "tg_leave_channel",
    {
      description:
        "Unsubscribe from a Telegram channel or leave a group. Accepts @username or numeric id. Channel owners cannot leave their own channel.",
      inputSchema: {
        channelId: z
          .string()
          .min(1)
          .describe("Channel or group @username or numeric id"),
        clearHistory: z
          .boolean()
          .optional()
          .describe("Clear chat history after leaving (legacy group chats only)"),
      },
    },
    async ({ channelId, clearHistory }) => {
      const client = await ctx.getClient();
      const result = await leaveChannel(client, channelId, { clearHistory });
      return jsonResult(result);
    },
  );

  server.registerTool(
    "tg_get_similar_channels",
    {
      description:
        "Get Telegram-recommended public channels similar to a channel, all channels in a folder, or your overall subscriptions. Only returns channels you are not subscribed to yet. Non-Premium accounts may receive a limited result set; check totalAvailable for the full count.",
      inputSchema: {
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
      },
    },
    async ({ channelId, folder }) => {
      const client = await ctx.getClient();
      const channels = await fetchSimilarChannels(client, { channelId, folder });
      return jsonResult(channels);
    },
  );

  server.registerTool(
    "tg_search_channels",
    {
      description:
        "Search public Telegram channels and groups via Telegram's global search. " +
        "Uses name/username matching (contacts.search) and/or post content search across public channels (searchGlobal). " +
        "For topic discovery (e.g. NFT gifts), prefer mode 'both' or 'posts'. Name search needs at least 4 characters.",
      inputSchema: {
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
      },
    },
    async ({ query, limit, mode }) => {
      const client = await ctx.getClient();
      const channels = await searchChannels(client, { query, limit, mode });
      return jsonResult(channels);
    },
  );
}
