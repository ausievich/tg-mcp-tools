import { MemoryStorage, TelegramClient } from "@mtcute/node";
import { getHostDeviceModel } from "./device-model.js";

export function createTelegramClientOptions(apiId: number, apiHash: string) {
  return {
    apiId,
    apiHash,
    storage: new MemoryStorage(),
    initConnectionOptions: {
      deviceModel: `tg-mcp on ${getHostDeviceModel()}`,
    },
  };
}

let client: TelegramClient | null = null;

export async function getTelegramClient(
  apiId: number,
  apiHash: string,
  session: string,
): Promise<TelegramClient> {
  if (!client) {
    client = new TelegramClient(createTelegramClientOptions(apiId, apiHash));
    await client.importSession(session, true);
  }
  return client;
}
