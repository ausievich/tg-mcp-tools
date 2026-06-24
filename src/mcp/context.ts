import type { TelegramClient } from "@mtcute/node";
import type { Config } from "../config.js";
import { getTelegramClient } from "../shared/client.js";

export type ToolContext = {
  getClient: () => Promise<TelegramClient>;
};

export function createToolContext(config: Config): ToolContext {
  const clientPromise = getTelegramClient(
    config.TELEGRAM_API_ID,
    config.TELEGRAM_API_HASH,
    config.TELEGRAM_SESSION,
  );
  return { getClient: () => clientPromise };
}
