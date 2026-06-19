import { MemoryStorage, TelegramClient } from "@mtcute/node";

let client: TelegramClient | null = null;

export async function getTelegramClient(
  apiId: number,
  apiHash: string,
  session: string,
): Promise<TelegramClient> {
  if (!client) {
    client = new TelegramClient({
      apiId,
      apiHash,
      storage: new MemoryStorage(),
    });
    await client.importSession(session, true);
  }
  return client;
}
