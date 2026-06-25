# tg-mcp

[![npm version](https://img.shields.io/npm/v/tg-mcp?style=flat-square&color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/tg-mcp)
[![License: MIT](https://img.shields.io/npm/l/tg-mcp?style=flat-square)](https://github.com/ausievich/tg-mcp-tools/blob/main/LICENSE)
[![Node.js](https://img.shields.io/node/v/tg-mcp?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![YouTube](https://img.shields.io/badge/YouTube-demo-FF0000?style=flat-square&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=XMBXVLT50vw)

A local MCP server for Cursor and Claude Desktop. It reads your Telegram subscriptions over MTProto (personal account, not a bot) and exposes channel posts to the agent for digests and natural-language questions like “what’s new in my Travel folder this week?”

## Features

- **15 MCP tools:** channels (create/rename), folders (create/edit), dialogs, messages, search, digests, send message, archive/unarchive
- **Post links** — every message includes a `url` field (`https://t.me/...`)
- **Archived channels** — included when listing subscriptions
- **QR login** — scan from the terminal, no SMS or in-app codes

## Requirements

- Node.js 18+
- Telegram API credentials from [my.telegram.org/apps](https://my.telegram.org/apps)

## Quick start (npm package)

Use this path if you consume the published package — no git clone needed.

**1. Create a project directory and install the package**

```bash
mkdir my-telegram-mcp && cd my-telegram-mcp
npm install tg-mcp
cp node_modules/tg-mcp/.env.example .env
```

**2. Add API credentials to `.env`**

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_api_hash
```

**3. Authorize** (QR in terminal; session is saved to `.env`)

```bash
npx tg-mcp-auth
```

On your phone: **Telegram → Settings → Devices → Link Desktop Device** → scan the QR code. `TELEGRAM_SESSION` is written to `.env` automatically.

**4. Connect MCP**

### Cursor

Add to `.cursor/mcp.json` in the same directory as `.env`:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "npx",
      "args": ["-y", "tg-mcp"]
    }
  }
}
```

The server loads `.env` from the **current working directory** (your project root). You don't need to duplicate env vars in `mcp.json`.

Reload Cursor after changing the config (**Developer: Reload Window**).

### Claude Desktop

Open the config file: **Settings → Developer → Edit Config** 

Add a `telegram` entry under `mcpServers`. Put credentials in `env` — Claude Desktop does not load `.env` from disk:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "npx",
      "args": ["-y", "tg-mcp"],
      "env": {
        "TELEGRAM_API_ID": "12345678",
        "TELEGRAM_API_HASH": "your_api_hash",
        "TELEGRAM_SESSION": "your_session_string"
      }
    }
  }
}
```

Copy the three values from `.env` after `npx tg-mcp-auth`. If you re-authorize, update `TELEGRAM_SESSION` here too.

Fully quit Claude Desktop (system tray → **Exit**), then relaunch. The connector appears under **Connectors**.

---

## Development (git clone)

Use this path if you work from the repository — local `src/`, rebuilds, and [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector).

**1. Clone and install**

```bash
git clone https://github.com/ausievich/tg-mcp-tools.git
cd tg-mcp-tools
npm install
cp .env.example .env
```

**2. Add API credentials to `.env`** (same as above)

**3. Build and authorize**

```bash
npm run build
npm run auth
```

**4. Connect MCP**

### Cursor

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

Run `npm run build` after code changes. `npm run inspect` builds and opens MCP Inspector for interactive tool testing.

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `tg_create_channel` | Create a new broadcast channel (title and optional description) |
| `tg_set_channel_title` | Rename a channel or group (requires admin rights) |
| `tg_get_folders` | Telegram chat folders (tabs) with id and name |
| `tg_create_folder` | Create a folder with channels and filter rules |
| `tg_edit_folder` | Update an existing folder: replace included chats or rename it |
| `tg_get_dialogs` | List channels, groups, and chats; optional `folder` filter |
| `tg_get_messages` | Posts from one channel; pagination (`beforeMessageId`), date filters (`sinceHours`, `minDate`) |
| `tg_search_messages` | Full-text search in one chat across entire history |
| `tg_search_in_folder` | Search by text across all channels/groups in a folder |
| `tg_get_recent_from_channels` | Digest from multiple channels, sorted by date |
| `tg_get_recent_from_folder` | Digest from all channels/groups in a folder |
| `tg_send_message` | Send formatted text to a user (@username), chat id, or `"me"` (Markdown/HTML) |
| `tg_archive_chats` | Move chats/channels to Archive |
| `tg_unarchive_chats` | Restore chats/channels from Archive |

Example prompts:

> What’s new in my **Travel** folder this week?

> Search my **Health** folder for **Dentist**

## Security

- **Do not commit `.env`** — it contains your Telegram session (full account access)
- **Claude Desktop:** `claude_desktop_config.json` with `env` holds the same secrets — treat it like `.env`
- Never share `TELEGRAM_SESSION` in logs, issues, or chats
- Revoke API credentials or sessions at [my.telegram.org](https://my.telegram.org)
- Log out locally: `npx tg-mcp-logout` (npm) or `npm run logout` (git clone)

## Stack

- [@mtcute/node](https://github.com/mtcute/mtcute) — MTProto client
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — MCP
- TypeScript (ESM), zod, dotenv
