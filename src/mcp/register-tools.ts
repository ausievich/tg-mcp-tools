import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.js";
import { registerChatsTools } from "../telegram/chats/tools.js";
import { registerDialogTools } from "../telegram/dialogs/tools.js";
import { registerFolderTools } from "../telegram/folders/tools.js";
import { registerMessageTools } from "../telegram/messages/tools.js";
import { registerSendTools } from "../telegram/send/tools.js";

export function registerAllTools(server: McpServer, ctx: ToolContext): void {
  registerChatsTools(server, ctx);
  registerFolderTools(server, ctx);
  registerDialogTools(server, ctx);
  registerMessageTools(server, ctx);
  registerSendTools(server, ctx);
}
