import { TelegramClient } from "@mtcute/node";
import { fetchDialogs } from "./dialogs.js";
import {
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
  resolvePeer,
} from "./peers.js";
import type { FolderRef, MessageInfo } from "./types.js";
import { buildTelegramPostUrl } from "./urls.js";

function hasTextContent(text: string): boolean {
  return text.trim().length > 0;
}

function messageMatchesSinceHours(date: Date, sinceHours?: number): boolean {
  if (sinceHours === undefined) {
    return true;
  }
  const minDate = new Date(Date.now() - sinceHours * 3600 * 1000);
  return date >= minDate;
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

export async function fetchMessages(
  telegramClient: TelegramClient,
  channelId: string,
  limit: number,
  sinceHours?: number,
): Promise<MessageInfo[]> {
  const peer = await resolvePeer(telegramClient, channelId);
  const channelName = getPeerName(peer);
  const resolvedChannelId = getPeerId(peer);
  const username = getPeerUsername(peer);
  const peerRef = normalizeChannelRef(channelId);

  const history = await telegramClient.getHistory(peerRef, { limit });

  return history
    .filter((message) => !message.isService)
    .filter((message) => hasTextContent(message.text))
    .filter((message) => messageMatchesSinceHours(message.date, sinceHours))
    .map((message) => mapMessage(message, channelName, resolvedChannelId, username));
}

export async function fetchRecentFromChannels(
  telegramClient: TelegramClient,
  channelIds: string[],
  sinceHours: number,
  limitPerChannel: number,
): Promise<MessageInfo[]> {
  const results = await Promise.all(
    channelIds.map(async (channelId) => {
      try {
        return await fetchMessages(
          telegramClient,
          channelId,
          limitPerChannel,
          sinceHours,
        );
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
  sinceHours: number,
  limitPerChannel: number,
): Promise<MessageInfo[]> {
  const dialogs = await fetchDialogs(telegramClient, 500, folder);
  const channelIds = dialogs
    .filter((dialog) => dialog.type === "channel" || dialog.type === "group")
    .map((dialog) => dialog.username ?? dialog.id);

  if (channelIds.length === 0) {
    return [];
  }

  return fetchRecentFromChannels(
    telegramClient,
    channelIds,
    sinceHours,
    limitPerChannel,
  );
}
