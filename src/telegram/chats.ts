import { TelegramClient, type InputPeerLike } from "@mtcute/node";
import { normalizeChannelRef } from "./peers.js";

export async function archiveChats(
  telegramClient: TelegramClient,
  channelIds: string[],
): Promise<void> {
  const peers: InputPeerLike[] = channelIds.map((channelId) =>
    normalizeChannelRef(channelId),
  );
  await telegramClient.archiveChats(peers);
}

export async function unarchiveChats(
  telegramClient: TelegramClient,
  channelIds: string[],
): Promise<void> {
  const peers: InputPeerLike[] = channelIds.map((channelId) =>
    normalizeChannelRef(channelId),
  );
  await telegramClient.unarchiveChats(peers);
}
