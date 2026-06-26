import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { channelIdsInput, getDialogsInput } from "./schemas.js";
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
      inputSchema: getDialogsInput,
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
      inputSchema: channelIdsInput,
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
      inputSchema: channelIdsInput,
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
      inputSchema: channelIdsInput,
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
      inputSchema: channelIdsInput,
    },
    async ({ channelIds }) => {
      const client = await ctx.getClient();
      await unmuteChats(client, channelIds);
      return jsonResult({ unmuted: channelIds });
    },
  );
}
