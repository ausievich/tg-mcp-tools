import { Chat, TelegramClient, type Peer, type tl } from "@mtcute/node";
import { fetchDialogs } from "../subscriptions/service.js";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
} from "../../shared/peers.js";
import type {
  ChannelInfo,
  ChannelSearchResult,
  CreateChannelParams,
  FolderRef,
  JoinChannelResult,
  SimilarChannelInfo,
} from "../../shared/types.js";
import { buildTelegramPostUrl } from "../../shared/urls.js";

function mapPeerToChannelInfo(peer: Peer): ChannelInfo {
  const info: ChannelInfo = {
    id: getPeerId(peer),
    name: getPeerName(peer),
  };

  const username = getPeerUsername(peer);
  if (username) {
    info.username = username;
    info.url = `https://t.me/${username}`;
  }

  return info;
}

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

  return mapPeerToChannelInfo(channel);
}

export async function setChannelTitle(
  telegramClient: TelegramClient,
  channelId: string,
  title: string,
): Promise<ChannelInfo> {
  const peerRef = normalizeChannelRef(channelId);
  await telegramClient.setChatTitle(peerRef, title);

  const channel = await telegramClient.getPeer(peerRef);
  return mapPeerToChannelInfo(channel);
}

export async function joinChannel(
  telegramClient: TelegramClient,
  channelId: string,
): Promise<JoinChannelResult> {
  const trimmed = channelId.trim();
  const joinRef = /t\.me\//i.test(trimmed) ? trimmed : normalizeChannelRef(trimmed);
  const result = await telegramClient.joinChat(joinRef);

  if (result.status === "request_sent") {
    return { status: "request_sent", channelId: trimmed };
  }

  if (result.status === "webview") {
    const botUsername = result.bot.username ?? undefined;
    return {
      status: "webview",
      channelId: trimmed,
      username: botUsername,
      url: botUsername ? `https://t.me/${botUsername}` : undefined,
    };
  }

  const channel = mapPeerToChannelInfo(result.chat);
  return {
    status: "joined",
    channelId: trimmed,
    id: channel.id,
    name: channel.name,
    username: channel.username,
    url: channel.url,
  };
}

export async function leaveChannel(
  telegramClient: TelegramClient,
  channelId: string,
  options?: { clearHistory?: boolean },
): Promise<{ channelId: string }> {
  const trimmed = channelId.trim();
  const peerRef = normalizeChannelRef(trimmed);
  await telegramClient.leaveChat(
    peerRef,
    options?.clearHistory ? { clear: true } : undefined,
  );
  return { channelId: trimmed };
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

export type SearchChannelsMode = "name" | "posts" | "both";

export interface SearchChannelsOptions {
  query: string;
  limit?: number;
  mode?: SearchChannelsMode;
}

function mapPeerToChannelSearchResult(
  peer: Peer,
  source: ChannelSearchResult["source"],
  matchedPost?: ChannelSearchResult["matchedPost"],
): ChannelSearchResult | null {
  if (peer.type !== "chat") {
    return null;
  }

  const type = peer.chatType === "channel" ? "channel" : "group";
  const username = getPeerUsername(peer);
  const result: ChannelSearchResult = {
    id: getPeerId(peer),
    name: getPeerName(peer),
    type,
    source,
  };

  if (username) {
    result.username = username;
    result.url = `https://t.me/${username}`;
  }

  if (peer.membersCount != null) {
    result.memberCount = peer.membersCount;
  }

  if (matchedPost) {
    result.matchedPost = matchedPost;
  }

  return result;
}

function dedupeChannelSearchResults(
  channels: ChannelSearchResult[],
  limit: number,
): ChannelSearchResult[] {
  const seen = new Set<string>();
  const result: ChannelSearchResult[] = [];

  for (const channel of channels) {
    const key = channel.username ?? channel.id;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(channel);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

async function searchChannelsByName(
  telegramClient: TelegramClient,
  query: string,
  limit: number,
): Promise<ChannelSearchResult[]> {
  try {
    const res = await telegramClient.call({
      _: "contacts.search",
      q: query,
      limit,
    });

    const chats = res.chats.map((chat) => new Chat(chat));
    return chats
      .map((chat) => mapPeerToChannelSearchResult(chat, "name"))
      .filter((channel): channel is ChannelSearchResult => channel !== null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("QUERY_TOO_SHORT")) {
      return [];
    }
    throw error;
  }
}

async function searchChannelsByPosts(
  telegramClient: TelegramClient,
  query: string,
  limit: number,
): Promise<ChannelSearchResult[]> {
  const messages = await telegramClient.searchGlobal({
    query,
    limit: Math.min(limit * 5, 100),
    onlyChannels: true,
  });

  const channels: ChannelSearchResult[] = [];

  for (const message of messages) {
    if (message.isService || !message.text.trim()) {
      continue;
    }

    const channel = mapPeerToChannelSearchResult(message.chat, "posts", {
      date: message.date.toISOString(),
      text: message.text,
      url: buildTelegramPostUrl(
        message.id,
        getPeerId(message.chat),
        getPeerUsername(message.chat),
      ),
    });

    if (channel) {
      channels.push(channel);
    }
  }

  return channels;
}

export async function searchChannels(
  telegramClient: TelegramClient,
  options: SearchChannelsOptions,
): Promise<ChannelSearchResult[]> {
  const query = options.query.trim();
  if (!query) {
    throw new Error("Search query must not be empty");
  }

  const limit = Math.min(options.limit ?? 20, 50);
  const mode = options.mode ?? "both";
  const results: ChannelSearchResult[] = [];

  if (mode === "name" || mode === "both") {
    results.push(...(await searchChannelsByName(telegramClient, query, limit)));
  }

  if (mode === "posts" || mode === "both") {
    results.push(...(await searchChannelsByPosts(telegramClient, query, limit)));
  }

  return dedupeChannelSearchResults(results, limit);
}
