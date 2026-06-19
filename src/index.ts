#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import {
  archiveChats,
  createTelegramFolder,
  fetchDialogs,
  fetchFolders,
  fetchMessages,
  fetchRecentFromChannels,
  fetchRecentFromFolder,
  getTelegramClient,
  sendTelegramMessage,
  unarchiveChats,
} from "./telegram-client.js";

const channelIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(100)
  .describe("List of @usernames or numeric ids");

const folderSchema = z
  .union([z.string().min(1), z.number().int()])
  .describe("Folder id (e.g. 2) or folder name (e.g. Travel). Use telegram_get_folders to list.");

const config = loadConfig();
const telegramClientPromise = getTelegramClient(
  config.TELEGRAM_API_ID,
  config.TELEGRAM_API_HASH,
  config.TELEGRAM_SESSION,
);

const server = new McpServer({
  name: "telegram-mcp",
  version: "1.0.0",
});

server.registerTool(
  "telegram_archive_chats",
  {
    description: "Move one or more chats/channels to Telegram Archive.",
    inputSchema: {
      channelIds: channelIdsSchema,
    },
  },
  async ({ channelIds }) => {
    const client = await telegramClientPromise;
    await archiveChats(client, channelIds);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ archived: channelIds }, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "telegram_unarchive_chats",
  {
    description: "Restore one or more chats/channels from Telegram Archive.",
    inputSchema: {
      channelIds: channelIdsSchema,
    },
  },
  async ({ channelIds }) => {
    const client = await telegramClientPromise;
    await unarchiveChats(client, channelIds);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ unarchived: channelIds }, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "telegram_create_folder",
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
    const client = await telegramClientPromise;
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

    return {
      content: [{ type: "text", text: JSON.stringify(folder, null, 2) }],
    };
  },
);

server.registerTool(
  "telegram_get_folders",
  {
    description:
      "Returns the list of Telegram chat folders (tabs) configured in the user's account.",
    inputSchema: {},
  },
  async () => {
    const client = await telegramClientPromise;
    const folders = await fetchFolders(client);
    return {
      content: [{ type: "text", text: JSON.stringify(folders, null, 2) }],
    };
  },
);

server.registerTool(
  "telegram_get_dialogs",
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
    const client = await telegramClientPromise;
    const dialogs = await fetchDialogs(client, limit ?? 100, folder);
    return {
      content: [{ type: "text", text: JSON.stringify(dialogs, null, 2) }],
    };
  },
);

server.registerTool(
  "telegram_get_messages",
  {
    description:
      "Returns recent messages from a single channel or chat. Each message includes a `url` field linking to the original Telegram post — always cite these links when summarizing for the user.",
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
        .max(168)
        .optional()
        .describe("Only messages from last N hours (max 168)"),
    },
  },
  async ({ channelId, limit, sinceHours }) => {
    const client = await telegramClientPromise;
    const messages = await fetchMessages(
      client,
      channelId,
      limit ?? 20,
      sinceHours,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
    };
  },
);

server.registerTool(
  "telegram_get_recent_from_folder",
  {
    description:
      "Fetches recent messages from all channels and groups in a Telegram folder, sorted by date descending. Each message includes a `url` field — always cite source links when summarizing for the user.",
    inputSchema: {
      folder: folderSchema,
      sinceHours: z
        .number()
        .int()
        .positive()
        .max(168)
        .optional()
        .describe("Last N hours (default 24, max 168)"),
      limitPerChannel: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Max messages per channel (default 50, max 100)"),
    },
  },
  async ({ folder, sinceHours, limitPerChannel }) => {
    const client = await telegramClientPromise;
    const messages = await fetchRecentFromFolder(
      client,
      folder,
      sinceHours ?? 24,
      limitPerChannel ?? 50,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
    };
  },
);

server.registerTool(
  "telegram_send_message",
  {
    description:
      "Send a formatted text message to a Telegram user, group, or channel. Accepts @username, numeric id, or \"me\" (Saved Messages). Supports Markdown and HTML. Long plain text is split automatically; formatted messages must fit in 4096 chars.",
    inputSchema: {
      chatId: z
        .string()
        .min(1)
        .describe('Recipient: @username, numeric id, or "me" for Saved Messages'),
      text: z
        .string()
        .min(1)
        .max(50000)
        .describe("Message body. Use Markdown links like [label](https://t.me/...) for digests."),
      format: z
        .enum(["plain", "markdown", "html"])
        .optional()
        .describe('Formatting: "markdown" (default), "html", or "plain"'),
    },
  },
  async ({ chatId, text, format }) => {
    const client = await telegramClientPromise;
    const result = await sendTelegramMessage(client, chatId, text, {
      format: format ?? "markdown",
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "telegram_get_recent_from_channels",
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
        .max(168)
        .optional()
        .describe("Last N hours (default 24, max 168)"),
      limitPerChannel: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Max messages per channel (default 50, max 100)"),
    },
  },
  async ({ channelIds, sinceHours, limitPerChannel }) => {
    const client = await telegramClientPromise;
    const messages = await fetchRecentFromChannels(
      client,
      channelIds,
      sinceHours ?? 24,
      limitPerChannel ?? 50,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`MCP server failed to start: ${message}`);
  process.exit(1);
});
