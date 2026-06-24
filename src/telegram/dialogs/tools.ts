import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { folderSchema } from "../../mcp/schemas.js";
import { fetchDialogs } from "./service.js";

export function registerDialogTools(server: McpServer, ctx: ToolContext): void {
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
}
