import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { channelIdsSchema } from "../../mcp/schemas.js";
import {
  archiveChats,
  createBroadcastChannel,
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
}
