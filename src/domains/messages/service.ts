import { Long, Message, PeersIndex, TelegramClient } from "@mtcute/node";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
  resolvePeer,
} from "../../shared/peers.js";
import type { FolderRef, MessageInfo, PostCommentInfo, PostCommentsResult } from "../../shared/types.js";
import { buildTelegramPostUrl, parseTelegramPostUrl } from "../../shared/urls.js";
import { fetchDialogs } from "../subscriptions/service.js";

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

export interface FetchPostCommentsOptions {
  limit?: number;
  offsetId?: number;
  offsetDate?: number;
  textOnly?: boolean;
}

export interface FetchPostCommentsParams {
  postUrl?: string;
  channelId?: string;
  messageId?: number;
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

function mapPostMessage(
  message: Message,
  channelName: string,
  channelId: string,
  username?: string,
  url?: string,
): MessageInfo {
  const info: MessageInfo = {
    id: message.id,
    date: message.date.toISOString(),
    text: message.text,
    channelName,
    channelId,
    url: url ?? buildTelegramPostUrl(message.id, channelId, username),
  };

  if (message.views !== null) {
    info.views = message.views;
  }

  return info;
}

function mapCommentMessage(message: Message): PostCommentInfo | null {
  if (message.isService) {
    return null;
  }

  const senderName = message.sender?.displayName;
  return {
    id: message.id,
    date: message.date.toISOString(),
    text: message.text,
    ...(senderName ? { senderName } : {}),
  };
}

async function resolveChannelPost(
  telegramClient: TelegramClient,
  params: FetchPostCommentsParams,
): Promise<{ post: Message; channelName: string; channelId: string; username?: string; url: string }> {
  if (params.postUrl) {
    const parsed = parseTelegramPostUrl(params.postUrl);
    const post = await telegramClient.getMessageByLink(parsed.url);
    if (!post) {
      throw new Error(`Post not found: ${parsed.url}`);
    }

    const peer = await resolvePeer(telegramClient, parsed.channelRef);
    return {
      post,
      channelName: getPeerName(peer),
      channelId: getPeerId(peer),
      username: getPeerUsername(peer),
      url: parsed.url,
    };
  }

  if (!params.channelId || params.messageId === undefined) {
    throw new Error("Provide postUrl or both channelId and messageId");
  }

  const peer = await resolvePeer(telegramClient, params.channelId);
  const channelName = getPeerName(peer);
  const channelId = getPeerId(peer);
  const username = getPeerUsername(peer);
  const peerRef = normalizeChannelRef(params.channelId);
  const [post] = await telegramClient.getMessages(peerRef, params.messageId);

  if (!post) {
    throw new Error(`Post not found: ${params.channelId}/${params.messageId}`);
  }

  return {
    post,
    channelName,
    channelId,
    username,
    url: buildTelegramPostUrl(params.messageId, channelId, username),
  };
}

export async function fetchPostComments(
  telegramClient: TelegramClient,
  params: FetchPostCommentsParams,
  options?: FetchPostCommentsOptions,
): Promise<PostCommentsResult> {
  const { post, channelName, channelId, username, url } = await resolveChannelPost(
    telegramClient,
    params,
  );

  const discussion = await telegramClient.getDiscussionMessage({
    chatId: normalizeChannelRef(channelId),
    message: post.id,
  });

  if (!discussion) {
    throw new Error(`Post has no comments section: ${url}`);
  }

  const limit = options?.limit ?? 100;
  const offsetId = options?.offsetId ?? 0;
  const offsetDate = options?.offsetDate ?? 0;
  const textOnly = options?.textOnly ?? false;

  const res = await telegramClient.call({
    _: "messages.getReplies",
    peer: discussion.chat.inputPeer,
    msgId: discussion.id,
    offsetId,
    offsetDate,
    addOffset: 0,
    limit,
    maxId: 0,
    minId: 0,
    hash: Long.ZERO,
  });

  if (!("messages" in res)) {
    throw new Error("Unexpected response while fetching post comments");
  }

  const peers = PeersIndex.from(res);
  const replyCount = "count" in res ? res.count : undefined;
  const comments = res.messages
    .filter((message) => message._ !== "messageEmpty")
    .map((message) => mapCommentMessage(new Message(message, peers)))
    .filter((comment): comment is PostCommentInfo => comment !== null)
    .filter((comment) => !textOnly || comment.text.trim().length > 0);

  const totalCount = discussion.replies?.count ?? replyCount ?? comments.length;
  const oldest = comments.at(-1);
  const hasMore = comments.length === limit;

  return {
    post: mapPostMessage(post, channelName, channelId, username, url),
    discussionChatName: discussion.chat.displayName,
    discussionChatId: getPeerId(discussion.chat),
    totalCount,
    comments,
    ...(hasMore && oldest
      ? {
          nextOffsetId: oldest.id,
          nextOffsetDate: Math.floor(new Date(oldest.date).getTime() / 1000),
        }
      : {}),
  };
}
