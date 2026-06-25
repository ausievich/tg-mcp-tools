import { TelegramClient, type InputPeerLike, type Peer } from "@mtcute/node";
import {
  getDialogType,
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
  normalizeFolderRef,
  peerToInputPeer,
  resolvePeer,
} from "../../shared/peers.js";
import type { DialogInfo, FolderRef } from "../../shared/types.js";

/** Max 32-bit Unix timestamp — Telegram clients use this for "mute forever". */
const MUTE_FOREVER_UNTIL = 2_147_483_647;

function mapDialogToInfo(peer: Peer, unreadCount: number): DialogInfo {
  const info: DialogInfo = {
    id: getPeerId(peer),
    name: getPeerName(peer),
    type: getDialogType(peer),
    unreadCount,
  };

  const username = getPeerUsername(peer);
  if (username) {
    info.username = username;
  }

  return info;
}

async function updateChatMute(
  telegramClient: TelegramClient,
  channelId: string,
  muteUntil: number,
): Promise<void> {
  const peer = await resolvePeer(telegramClient, channelId);
  await telegramClient.call({
    _: "account.updateNotifySettings",
    peer: {
      _: "inputNotifyPeer",
      peer: peerToInputPeer(peer),
    },
    settings: {
      _: "inputPeerNotifySettings",
      muteUntil,
    },
  });
}

export async function fetchDialogs(
  telegramClient: TelegramClient,
  limit: number,
  folder?: FolderRef,
): Promise<DialogInfo[]> {
  const dialogs: DialogInfo[] = [];
  const iterParams: {
    limit: number;
    archived: "keep" | "exclude" | "only";
    folder?: string | number;
  } = { limit, archived: "keep" };

  if (folder !== undefined) {
    iterParams.folder = normalizeFolderRef(folder);
  }

  for await (const dialog of telegramClient.iterDialogs(iterParams)) {
    dialogs.push(mapDialogToInfo(dialog.peer, dialog.unreadCount));
  }

  return dialogs;
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

export async function muteChats(
  telegramClient: TelegramClient,
  channelIds: string[],
): Promise<void> {
  await Promise.all(
    channelIds.map((channelId) =>
      updateChatMute(telegramClient, channelId, MUTE_FOREVER_UNTIL),
    ),
  );
}

export async function unmuteChats(
  telegramClient: TelegramClient,
  channelIds: string[],
): Promise<void> {
  await Promise.all(
    channelIds.map((channelId) => updateChatMute(telegramClient, channelId, 0)),
  );
}
