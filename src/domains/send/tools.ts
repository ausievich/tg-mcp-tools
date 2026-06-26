import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { sendMessageInput } from "./schemas.js";
import { sendTelegramMessage } from "./service.js";

export function registerSendTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_send_message",
    {
      description:
        "Send a formatted text message to a Telegram user, group, or channel. Accepts @username, numeric id, or \"me\" (Saved Messages). Supports Markdown and HTML. Long plain text is split automatically; formatted messages must fit in 4096 chars.",
      inputSchema: sendMessageInput,
    },
    async ({ chatId, text, format }) => {
      const client = await ctx.getClient();
      const result = await sendTelegramMessage(client, chatId, text, {
        format: format ?? "markdown",
      });
      return jsonResult(result);
    },
  );
}
