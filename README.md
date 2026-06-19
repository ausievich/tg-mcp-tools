# tg-mcp-tools

[![npm version](https://img.shields.io/npm/v/tg-mcp-tools?style=flat-square&color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/tg-mcp-tools)

A local MCP server for Cursor and Claude Desktop. It reads your Telegram subscriptions over MTProto (personal account, not a bot) and exposes channel posts to the agent for digests and natural-language questions like “what’s new in my Travel folder this week?”

## Install

```bash
npm install -g tg-mcp-tools
```

Or run without installing (recommended for MCP):

```bash
npx tg-mcp-tools-auth   # one-time login
npx tg-mcp-tools        # MCP server (stdio)
```

## Features

- **10 MCP tools:** folders, dialogs, messages, digests, send message, archive/unarchive
- **Post links** — every message includes a `url` field (`https://t.me/...`)
- **Archived channels** — included when listing subscriptions
- **QR login** — scan from the terminal, no SMS or in-app codes

## Requirements

- Node.js 18+
- Telegram API credentials from [my.telegram.org/apps](https://my.telegram.org/apps)

## Quick start

Create a project directory, add credentials, authorize, then connect MCP.

```bash
mkdir my-telegram-mcp && cd my-telegram-mcp
cp path/to/node_modules/tg-mcp-tools/.env.example .env
# or from a git clone: cp .env.example .env
```

Fill in `.env`:

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_api_hash
```

Authorize (scan QR in terminal; session is saved to `.env` in the current directory):

```bash
npx tg-mcp-tools-auth
# or, from a git clone: npm run auth
```

Verify the MCP server starts:

```bash
npx tg-mcp-tools
# or, from a git clone: npm run mcp
```

## Cursor setup

Add to `.cursor/mcp.json` in your project (where `.env` lives):

```json
{
  "mcpServers": {
    "telegram": {
      "command": "npx",
      "args": ["-y", "tg-mcp-tools"]
    }
  }
}
```

The server loads `.env` from the **current working directory** (your project root). You don't need to duplicate env vars in `mcp.json` if `.env` is present.

For local development from a git clone, use:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "npm",
      "args": ["run", "mcp"]
    }
  }
}
```

After changing the config, reload Cursor (**Developer: Reload Window**).

## MCP tools

| Tool | Purpose |
|------|---------|
| `telegram_get_folders` | Telegram chat folders (tabs) with id and name |
| `telegram_create_folder` | Create a folder with channels and filter rules |
| `telegram_get_dialogs` | List channels, groups, and chats; optional `folder` filter |
| `telegram_get_messages` | Posts from one channel (@username or numeric id) |
| `telegram_get_recent_from_channels` | Digest from multiple channels, sorted by date |
| `telegram_get_recent_from_folder` | Digest from all channels/groups in a folder |
| `telegram_send_message` | Send formatted text to a user (@username), chat id, or `"me"` (Markdown/HTML) |
| `telegram_archive_chats` | Move chats/channels to Archive |
| `telegram_unarchive_chats` | Restore chats/channels from Archive |

Example prompts in Cursor:

> What’s new in my **Travel** folder this week?

## Authorization

1. Run `npx tg-mcp-tools-auth` from the directory where `.env` should live
2. On your phone: **Telegram → Settings → Devices → Link Desktop Device**
3. Scan the QR code in the terminal
4. Enter your 2FA password if prompted
5. `TELEGRAM_SESSION` is written to `.env` automatically

## Scripts

| Command | Description |
|---------|-------------|
| `npx tg-mcp-tools-auth` | One-time login; saves `TELEGRAM_SESSION` to `.env` in cwd |
| `npx tg-mcp-tools` | Start the MCP server (stdio) |
| `npm run auth` / `npm run mcp` | Same, when developing from a git clone |
| `npm run build` | Compile TypeScript → `dist/` |

## Security

- **Do not commit `.env`** — it contains your Telegram session (full account access)
- Never share `TELEGRAM_SESSION` in logs, issues, or chats
- Revoke API credentials or sessions at [my.telegram.org](https://my.telegram.org)

## Project layout

```
src/
├── config.ts           # load .env from repo root
├── env-file.ts         # update .env values after auth
├── telegram-client.ts  # mtcute: dialogs, history, post URLs
├── index.ts            # MCP server and tool registration
└── auth.ts             # CLI auth (QR)
```

## Stack

- [@mtcute/node](https://github.com/mtcute/mtcute) — MTProto client
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — MCP
- TypeScript (ESM), zod, dotenv
