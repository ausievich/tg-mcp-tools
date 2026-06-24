import { TelegramClient } from "@mtcute/node";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
  resolvePeer,
} from "../../shared/peers.js";
import type { FolderRef, MessageInfo } from "../../shared/types.js";
import { buildTelegramPostUrl } from "../../shared/urls.js";
import { fetchDialogs } from "../dialogs/service.js";

export interface FetchMessagesOptions {
  sinceHours?: number;
  minDate?: Date;
  beforeMessageId?: number;
  /** Unix timestamp (seconds) of `beforeMessageId` — required for reliable pagination */
  beforeMessageDate?: number;
}

export interface SearchMessagesOptions {
  query: string;
  limit?: number;
  offset?: number;
  minDate?: Date;
  maxDate?: Date;
}

export interface SearchMessagesResult {
  messages: MessageInfo[];
  nextOffset?: number;
}

function hasTextContent(text: string): boolean {
  return text.trim().length > 0;
}

function messageMatchesDateFilter(date: Date, options?: FetchMessagesOptions): boolean {
  if (!options) {
    return true;
  }

  if (options.sinceHours !== undefined) {
    const minDate = new Date(Date.now() - options.sinceHours * 3600 * 1000);
    if (date < minDate) {
      return false;
    }
  }

  if (options.minDate !== undefined && date < options.minDate) {
    return false;
  }

  return true;
}

function mapMessage(
  message: { id: number; date: Date; text: string; views: number | null; isService: boolean },
  channelName: string,
  channelId: string,
  username?: string,
): MessageInfo {
  const info: MessageInfo = {
    id: message.id,
    date: message.date.toISOString(),
    text: message.text,
    channelName,
    channelId,
    url: buildTelegramPostUrl(message.id, channelId, username),
  };

  if (message.views !== null) {
    info.views = message.views;
  }

  return info;
}

function resolveFetchOptions(options?: FetchMessagesOptions | number): FetchMessagesOptions | undefined {
  if (options === undefined) {
    return undefined;
  }

  return typeof options === "number" ? { sinceHours: options } : options;
}

export async function fetchMessages(
  telegramClient: TelegramClient,
  channelId: string,
  limit: number,
  options?: FetchMessagesOptions | number,
): Promise<MessageInfo[]> {
  const resolvedOptions = resolveFetchOptions(options);
  const peer = await resolvePeer(telegramClient, channelId);
  const channelName = getPeerName(peer);
  const resolvedChannelId = getPeerId(peer);
  const username = getPeerUsername(peer);
  const peerRef = normalizeChannelRef(channelId);

  const historyParams: {
    limit: number;
    offset?: { id: number; date: number };
  } = { limit };
  if (resolvedOptions?.beforeMessageId !== undefined) {
    historyParams.offset = {
      id: resolvedOptions.beforeMessageId,
      date: resolvedOptions.beforeMessageDate ?? 0,
    };
  }

  const history = await telegramClient.getHistory(peerRef, historyParams);

  return history
    .filter((message) => !message.isService)
    .filter((message) => hasTextContent(message.text))
    .filter((message) => messageMatchesDateFilter(message.date, resolvedOptions))
    .map((message) => mapMessage(message, channelName, resolvedChannelId, username));
}

export async function searchMessagesInChat(
  telegramClient: TelegramClient,
  channelId: string,
  options: SearchMessagesOptions,
): Promise<SearchMessagesResult> {
  const peer = await resolvePeer(telegramClient, channelId);
  const channelName = getPeerName(peer);
  const resolvedChannelId = getPeerId(peer);
  const username = getPeerUsername(peer);
  const peerRef = normalizeChannelRef(channelId);

  const result = await telegramClient.searchMessages({
    query: options.query,
    chatId: peerRef,
    limit: options.limit ?? 50,
    offset: options.offset,
    minDate: options.minDate,
    maxDate: options.maxDate,
  });

  const messages = result
    .filter((message) => !message.isService)
    .filter((message) => hasTextContent(message.text))
    .map((message) => mapMessage(message, channelName, resolvedChannelId, username));

  return {
    messages,
    nextOffset: result.next,
  };
}

export async function searchMessagesInFolder(
  telegramClient: TelegramClient,
  folder: FolderRef,
  options: SearchMessagesOptions,
  limitPerChannel = 20,
): Promise<SearchMessagesResult> {
  const dialogs = await fetchDialogs(telegramClient, 500, folder);
  const channelIds = dialogs
    .filter((dialog) => dialog.type === "channel" || dialog.type === "group")
    .map((dialog) => dialog.username ?? dialog.id);

  if (channelIds.length === 0) {
    return { messages: [] };
  }

  const results = await Promise.all(
    channelIds.map(async (id) => {
      try {
        return await searchMessagesInChat(telegramClient, id, {
          ...options,
          limit: limitPerChannel,
        });
      } catch {
        return { messages: [] } satisfies SearchMessagesResult;
      }
    }),
  );

  return {
    messages: results
      .flatMap((result) => result.messages)
      .sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
  };
}

export async function fetchRecentFromChannels(
  telegramClient: TelegramClient,
  channelIds: string[],
  optionsOrSinceHours: FetchMessagesOptions | number,
  limitPerChannel: number,
): Promise<MessageInfo[]> {
  const options = resolveFetchOptions(optionsOrSinceHours) ?? {};
  const results = await Promise.all(
    channelIds.map(async (channelId) => {
      try {
        return await fetchMessages(telegramClient, channelId, limitPerChannel, options);
      } catch {
        return [];
      }
    }),
  );

  return results
    .flat()
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export async function fetchRecentFromFolder(
  telegramClient: TelegramClient,
  folder: FolderRef,
  optionsOrSinceHours: FetchMessagesOptions | number,
  limitPerChannel: number,
): Promise<MessageInfo[]> {
  const dialogs = await fetchDialogs(telegramClient, 500, folder);
  const channelIds = dialogs
    .filter((dialog) => dialog.type === "channel" || dialog.type === "group")
    .map((dialog) => dialog.username ?? dialog.id);

  if (channelIds.length === 0) {
    return [];
  }

  return fetchRecentFromChannels(telegramClient, channelIds, optionsOrSinceHours, limitPerChannel);
}
