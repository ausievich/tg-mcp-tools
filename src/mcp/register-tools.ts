import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.js";
import { registerChatsTools } from "../domains/chats/tools.js";
import { registerDialogTools } from "../domains/dialogs/tools.js";
import { registerFolderTools } from "../domains/folders/tools.js";
import { registerMessageTools } from "../domains/messages/tools.js";
import { registerSendTools } from "../domains/send/tools.js";

export function registerAllTools(server: McpServer, ctx: ToolContext): void {
  registerChatsTools(server, ctx);
  registerFolderTools(server, ctx);
  registerDialogTools(server, ctx);
  registerMessageTools(server, ctx);
  registerSendTools(server, ctx);
}
