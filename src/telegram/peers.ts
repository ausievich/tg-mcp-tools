import {
  TelegramClient,
  type InputPeerLike,
  type Peer,
  type tl,
} from "@mtcute/node";
import type { DialogType, FolderRef } from "./types.js";

export function normalizeFolderRef(folder: FolderRef): string | number {
  if (typeof folder === "number") {
    return folder;
  }

  const trimmed = folder.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  return trimmed;
}

export function normalizeChannelRef(channelId: string): InputPeerLike {
  const trimmed = channelId.trim();
  if (trimmed.startsWith("@")) {
    return trimmed.slice(1);
  }
  if (/^-?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

export function getPeerId(peer: Peer): string {
  return String(peer.id);
}

export function getPeerName(peer: Peer): string {
  return peer.displayName;
}

export function getDialogType(peer: Peer): DialogType {
  if (peer.type === "user") {
    return "user";
  }
  return peer.chatType === "channel" ? "channel" : "group";
}

export function getPeerUsername(peer: Peer): string | undefined {
  const username = peer.username;
  return username ?? undefined;
}

export function peerToInputPeer(peer: Peer): tl.TypeInputPeer {
  if (peer.type === "user") {
    const accessHash = peer.raw.accessHash;
    if (accessHash === undefined) {
      throw new Error(`Cannot resolve user ${peer.displayName} for folder`);
    }

    return {
      _: "inputPeerUser",
      userId: peer.id,
      accessHash,
    };
  }

  if (peer.raw._ === "channel") {
    const accessHash = peer.raw.accessHash;
    if (accessHash === undefined) {
      throw new Error(`Cannot resolve channel ${peer.displayName} for folder`);
    }

    return {
      _: "inputPeerChannel",
      channelId: Number.parseInt(String(Math.abs(peer.id)).slice(3), 10),
      accessHash,
    };
  }

  if (peer.raw._ === "chat") {
    return {
      _: "inputPeerChat",
      chatId: peer.raw.id,
    };
  }

  throw new Error(`Unsupported chat type for folder: ${peer.displayName}`);
}

export async function resolveInputPeers(
  telegramClient: TelegramClient,
  channelIds: string[],
): Promise<tl.TypeInputPeer[]> {
  const peers = await Promise.all(
    channelIds.map(async (channelId) => {
      const peerRef = normalizeChannelRef(channelId);
      return telegramClient.getPeer(peerRef);
    }),
  );

  return peers.map((peer) => peerToInputPeer(peer));
}

export async function resolvePeer(
  telegramClient: TelegramClient,
  channelId: string,
): Promise<Peer> {
  const peerRef = normalizeChannelRef(channelId);
  return telegramClient.getPeer(peerRef);
}
