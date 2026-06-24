#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createToolContext } from "./mcp/context.js";
import { registerAllTools } from "./mcp/register-tools.js";

const server = new McpServer({
  name: "telegram-mcp",
  version: "1.2.0",
});

registerAllTools(server, createToolContext(loadConfig()));

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`MCP server failed to start: ${message}`);
  process.exit(1);
});
