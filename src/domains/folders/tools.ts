import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { createFolderInput, editFolderInput } from "./schemas.js";
import { createTelegramFolder, editTelegramFolder, fetchFolders } from "./service.js";

export function registerFolderTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_create_folder",
    {
      description:
        "Creates a new Telegram chat folder with optional channels and filter rules.",
      inputSchema: createFolderInput,
    },
    async ({
      name,
      includeChannels,
      excludeChannels,
      emoticon,
      includeAllBroadcasts,
      includeAllGroups,
      includeAllContacts,
      includeAllNonContacts,
      includeAllBots,
      excludeMuted,
      excludeRead,
      excludeArchived,
    }) => {
      const client = await ctx.getClient();
      const includeAll: Record<string, boolean> = {};
      if (includeAllBroadcasts) {
        includeAll.broadcasts = true;
      }
      if (includeAllGroups) {
        includeAll.groups = true;
      }
      if (includeAllContacts) {
        includeAll.contacts = true;
      }
      if (includeAllNonContacts) {
        includeAll.nonContacts = true;
      }
      if (includeAllBots) {
        includeAll.bots = true;
      }

      const exclude: Record<string, boolean> = {};
      if (excludeMuted) {
        exclude.muted = true;
      }
      if (excludeRead) {
        exclude.read = true;
      }
      if (excludeArchived) {
        exclude.archived = true;
      }

      const folder = await createTelegramFolder(client, {
        name,
        includeChannels,
        excludeChannels,
        emoticon,
        includeAll: Object.keys(includeAll).length > 0 ? includeAll : undefined,
        exclude: Object.keys(exclude).length > 0 ? exclude : undefined,
      });

      return jsonResult(folder);
    },
  );

  server.registerTool(
    "tg_edit_folder",
    {
      description:
        "Updates an existing Telegram chat folder: replace included channels or rename it.",
      inputSchema: editFolderInput,
    },
    async ({ folder, name, includeChannels, emoticon }) => {
      const client = await ctx.getClient();
      const updated = await editTelegramFolder(client, folder, {
        name,
        includeChannels,
        emoticon,
      });

      return jsonResult(updated);
    },
  );

  server.registerTool(
    "tg_get_folders",
    {
      description:
        "Returns the list of Telegram chat folders (tabs) configured in the user's account.",
      inputSchema: {},
    },
    async () => {
      const client = await ctx.getClient();
      const folders = await fetchFolders(client);
      return jsonResult(folders);
    },
  );
}
