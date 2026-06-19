import { TelegramClient, type InputPeerLike } from "@mtcute/node";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
} from "./peers.js";
import type { ChannelInfo, CreateChannelParams } from "./types.js";

export async function createBroadcastChannel(
  telegramClient: TelegramClient,
  params: CreateChannelParams,
): Promise<ChannelInfo> {
  const channel = await telegramClient.createChannel({
    title: params.title,
    description: params.description,
  });

  const info: ChannelInfo = {
    id: getPeerId(channel),
    name: getPeerName(channel),
  };

  const username = getPeerUsername(channel);
  if (username) {
    info.username = username;
    info.url = `https://t.me/${username}`;
  }

  return info;
}

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
