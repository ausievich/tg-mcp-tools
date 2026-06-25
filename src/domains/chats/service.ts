import { TelegramClient, type InputPeerLike } from "@mtcute/node";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
} from "../../shared/peers.js";
import type { ChannelInfo, CreateChannelParams } from "../../shared/types.js";

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

export async function setChannelTitle(
  telegramClient: TelegramClient,
  channelId: string,
  title: string,
): Promise<ChannelInfo> {
  const peerRef = normalizeChannelRef(channelId);
  await telegramClient.setChatTitle(peerRef, title);

  const channel = await telegramClient.getPeer(peerRef);
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
