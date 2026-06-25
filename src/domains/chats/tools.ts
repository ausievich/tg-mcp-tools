import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { channelIdsSchema, folderSchema } from "../../mcp/schemas.js";
import {
  archiveChats,
  createBroadcastChannel,
  fetchSimilarChannels,
  setChannelTitle,
  unarchiveChats,
} from "./service.js";

export function registerChatsTools(server: McpServer, ctx: ToolContext): void {
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
    "tg_archive_chats",
    {
      description: "Move one or more chats/channels to Telegram Archive.",
      inputSchema: {
        channelIds: channelIdsSchema,
      },
    },
    async ({ channelIds }) => {
      const client = await ctx.getClient();
      await archiveChats(client, channelIds);
      return jsonResult({ archived: channelIds });
    },
  );

  server.registerTool(
    "tg_unarchive_chats",
    {
      description: "Restore one or more chats/channels from Telegram Archive.",
      inputSchema: {
        channelIds: channelIdsSchema,
      },
    },
    async ({ channelIds }) => {
      const client = await ctx.getClient();
      await unarchiveChats(client, channelIds);
      return jsonResult({ unarchived: channelIds });
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
}
