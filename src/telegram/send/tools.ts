import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "../../mcp/context.js";
import { jsonResult } from "../../mcp/helpers.js";
import { sendTelegramMessage } from "./service.js";

export function registerSendTools(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "tg_send_message",
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
      const client = await ctx.getClient();
      const result = await sendTelegramMessage(client, chatId, text, {
        format: format ?? "markdown",
      });
      return jsonResult(result);
    },
  );
}
