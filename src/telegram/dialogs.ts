import { TelegramClient, type Peer } from "@mtcute/node";
import {
  getDialogType,
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeFolderRef,
} from "./peers.js";
import type { DialogInfo, FolderRef } from "./types.js";

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
