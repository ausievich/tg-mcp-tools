import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.js";
import { registerChannelTools } from "../domains/channels/tools.js";
import { registerFolderTools } from "../domains/folders/tools.js";
import { registerMessageTools } from "../domains/messages/tools.js";
import { registerSendTools } from "../domains/send/tools.js";
import { registerSubscriptionTools } from "../domains/subscriptions/tools.js";

export function registerAllTools(server: McpServer, ctx: ToolContext): void {
  registerChannelTools(server, ctx);
  registerSubscriptionTools(server, ctx);
  registerFolderTools(server, ctx);
  registerMessageTools(server, ctx);
  registerSendTools(server, ctx);
}
