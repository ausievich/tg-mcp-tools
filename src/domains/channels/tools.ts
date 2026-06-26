import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import {
  createChannelInput,
  getSimilarChannelsInput,
  joinChannelInput,
  leaveChannelInput,
  searchChannelsInput,
  setChannelTitleInput,
} from "./schemas.js";
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
      inputSchema: createChannelInput,
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
      inputSchema: setChannelTitleInput,
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
      inputSchema: joinChannelInput,
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
      inputSchema: leaveChannelInput,
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
      inputSchema: getSimilarChannelsInput,
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
      inputSchema: searchChannelsInput,
    },
    async ({ query, limit, mode }) => {
      const client = await ctx.getClient();
      const channels = await searchChannels(client, { query, limit, mode });
      return jsonResult(channels);
    },
  );
}
