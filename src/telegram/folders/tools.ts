import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { folderSchema } from "../../mcp/schemas.js";
import { createTelegramFolder, editTelegramFolder, fetchFolders } from "./service.js";

export function registerFolderTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_create_folder",
    {
      description:
        "Creates a new Telegram chat folder with optional channels and filter rules.",
      inputSchema: {
        name: z
          .string()
          .min(1)
          .max(12)
          .describe("Folder name (max 12 UTF-8 characters, Telegram limit)"),
        includeChannels: z
          .array(z.string().min(1))
          .max(100)
          .optional()
          .describe("Channels/groups to include (@username or numeric id)"),
        excludeChannels: z
          .array(z.string().min(1))
          .max(100)
          .optional()
          .describe("Channels/groups to exclude (@username or numeric id)"),
        emoticon: z
          .string()
          .optional()
          .describe("Folder icon emoji (e.g. ✈️)"),
        includeAllBroadcasts: z
          .boolean()
          .optional()
          .describe("Auto-include all channels"),
        includeAllGroups: z
          .boolean()
          .optional()
          .describe("Auto-include all groups"),
        includeAllContacts: z.boolean().optional(),
        includeAllNonContacts: z.boolean().optional(),
        includeAllBots: z.boolean().optional(),
        excludeMuted: z.boolean().optional(),
        excludeRead: z.boolean().optional(),
        excludeArchived: z.boolean().optional(),
      },
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
      inputSchema: {
        folder: folderSchema,
        name: z
          .string()
          .min(1)
          .max(12)
          .optional()
          .describe("New folder name (max 12 UTF-8 characters)"),
        includeChannels: z
          .array(z.string().min(1))
          .max(100)
          .optional()
          .describe("Channels/groups to include (@username or numeric id); replaces current list"),
        emoticon: z.string().optional().describe("Folder icon emoji"),
      },
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
