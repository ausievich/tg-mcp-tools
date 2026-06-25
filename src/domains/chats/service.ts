import { Chat, TelegramClient, type InputPeerLike, type Peer, type tl } from "@mtcute/node";
import { fetchDialogs } from "../dialogs/service.js";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
} from "../../shared/peers.js";
import type {
  ChannelInfo,
  CreateChannelParams,
  FolderRef,
  SimilarChannelInfo,
} from "../../shared/types.js";

function mapSimilarChannel(
  peer: Peer,
  options?: { basedOn?: string; totalAvailable?: number },
): SimilarChannelInfo {
  const info: SimilarChannelInfo = {
    id: getPeerId(peer),
    name: getPeerName(peer),
  };

  const username = getPeerUsername(peer);
  if (username) {
    info.username = username;
    info.url = `https://t.me/${username}`;
  }
  if (options?.basedOn) {
    info.basedOn = options.basedOn;
  }
  if (options?.totalAvailable !== undefined) {
    info.totalAvailable = options.totalAvailable;
  }

  return info;
}

function parseRecommendationsResponse(
  res: tl.messages.TypeChats,
  basedOn?: string,
): SimilarChannelInfo[] {
  const parsed = res.chats.map((chat) => new Chat(chat));

  switch (res._) {
    case "messages.chatsSlice":
      return parsed.map((peer) =>
        mapSimilarChannel(peer, { basedOn, totalAvailable: res.count }),
      );
    case "messages.chats":
      return parsed.map((peer) =>
        mapSimilarChannel(peer, { basedOn, totalAvailable: parsed.length }),
      );
  }
}

function dedupeSimilarChannels(channels: SimilarChannelInfo[]): SimilarChannelInfo[] {
  const seen = new Set<string>();
  const result: SimilarChannelInfo[] = [];

  for (const channel of channels) {
    const key = channel.username ?? channel.id;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(channel);
  }

  return result;
}

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

export async function fetchSimilarChannels(
  telegramClient: TelegramClient,
  options?: { channelId?: string; folder?: FolderRef },
): Promise<SimilarChannelInfo[]> {
  if (options?.channelId) {
    const peerRef = normalizeChannelRef(options.channelId);
    const similar = await telegramClient.getSimilarChannels(peerRef);
    return similar.map((peer) =>
      mapSimilarChannel(peer, {
        basedOn: options.channelId,
        totalAvailable: similar.total,
      }),
    );
  }

  if (options?.folder !== undefined) {
    const dialogs = await fetchDialogs(telegramClient, 500, options.folder);
    const seeds = dialogs
      .filter((dialog) => dialog.type === "channel")
      .map((dialog) => dialog.username ?? dialog.id);

    if (seeds.length === 0) {
      return [];
    }

    const results = await Promise.all(
      seeds.map(async (seed) => {
        try {
          const similar = await telegramClient.getSimilarChannels(
            normalizeChannelRef(seed),
          );
          return similar.map((peer) =>
            mapSimilarChannel(peer, { basedOn: seed, totalAvailable: similar.total }),
          );
        } catch {
          return [] satisfies SimilarChannelInfo[];
        }
      }),
    );

    return dedupeSimilarChannels(results.flat());
  }

  const res = await telegramClient.call({ _: "channels.getChannelRecommendations" });
  return parseRecommendationsResponse(res);
}
