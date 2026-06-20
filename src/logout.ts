#!/usr/bin/env node
import { TelegramClient } from "@mtcute/node";
import { envFilePath, loadConfig } from "./config.js";
import { updateEnvFileVariable } from "./env-file.js";
import { createTelegramClientOptions } from "./telegram/client.js";

async function clearLocalSession(): Promise<void> {
  await updateEnvFileVariable(envFilePath, "TELEGRAM_SESSION", "");
}

async function main(): Promise<void> {
  const config = loadConfig();

  const client = new TelegramClient(
    createTelegramClientOptions(config.TELEGRAM_API_ID, config.TELEGRAM_API_HASH),
  );

  await client.importSession(config.TELEGRAM_SESSION, true);

  try {
    await client.logOut();
    console.log("Telegram session terminated.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Telegram logOut failed (${message}). Clearing local session anyway.`);
  } finally {
    await clearLocalSession();
    await client.destroy();
  }

  console.log(`TELEGRAM_SESSION cleared in ${envFilePath}`);
  console.log("If MCP was running in Cursor, reload the window or restart the server.\n");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Logout failed: ${message}`);
  process.exit(1);
});
