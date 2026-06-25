import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { channelIdsSchema, folderSchema } from "../../mcp/schemas.js";
import {
  archiveChats,
  fetchDialogs,
  muteChats,
  unarchiveChats,
  unmuteChats,
} from "./service.js";

export function registerSubscriptionTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_get_dialogs",
    {
      description:
        "Returns dialogs (channels, groups, chats) the user is subscribed to. Optionally filter by Telegram folder.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .positive()
          .max(500)
          .optional()
          .describe("Max dialogs to return (default 100, max 500)"),
        folder: folderSchema
          .optional()
          .describe("Folder id or name. Omit for all chats."),
      },
    },
    async ({ limit, folder }) => {
      const client = await ctx.getClient();
      const dialogs = await fetchDialogs(client, limit ?? 100, folder);
      return jsonResult(dialogs);
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
    "tg_mute_chats",
    {
      description:
        "Mute notifications for one or more chats/channels forever (same as Telegram's mute-until-2038).",
      inputSchema: {
        channelIds: channelIdsSchema,
      },
    },
    async ({ channelIds }) => {
      const client = await ctx.getClient();
      await muteChats(client, channelIds);
      return jsonResult({ muted: channelIds });
    },
  );

  server.registerTool(
    "tg_unmute_chats",
    {
      description: "Restore notifications for one or more muted chats/channels.",
      inputSchema: {
        channelIds: channelIdsSchema,
      },
    },
    async ({ channelIds }) => {
      const client = await ctx.getClient();
      await unmuteChats(client, channelIds);
      return jsonResult({ unmuted: channelIds });
    },
  );
}
