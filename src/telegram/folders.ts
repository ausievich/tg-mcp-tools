import { TelegramClient, type tl } from "@mtcute/node";
import { resolveInputPeers } from "./peers.js";
import type { CreateFolderParams, FolderInfo } from "./types.js";

function mapDialogFilter(filter: tl.TypeDialogFilter): FolderInfo | null {
  if (filter._ === "dialogFilterDefault") {
    return {
      id: 0,
      name: "All chats",
      type: "default",
      pinnedCount: 0,
      includedPeersCount: 0,
    };
  }

  if (filter._ === "dialogFilterChatlist") {
    const info: FolderInfo = {
      id: filter.id,
      name: filter.title.text,
      type: "chatlist",
      pinnedCount: filter.pinnedPeers.length,
      includedPeersCount: filter.includePeers.length,
    };

    if (filter.emoticon) {
      info.emoticon = filter.emoticon;
    }
    if (filter.color !== undefined) {
      info.color = filter.color;
    }

    return info;
  }

  if (filter._ !== "dialogFilter") {
    return null;
  }

  const includeAll: NonNullable<FolderInfo["includeAll"]> = {};
  if (filter.contacts) {
    includeAll.contacts = true;
  }
  if (filter.nonContacts) {
    includeAll.nonContacts = true;
  }
  if (filter.groups) {
    includeAll.groups = true;
  }
  if (filter.broadcasts) {
    includeAll.broadcasts = true;
  }
  if (filter.bots) {
    includeAll.bots = true;
  }

  const exclude: NonNullable<FolderInfo["exclude"]> = {};
  if (filter.excludeMuted) {
    exclude.muted = true;
  }
  if (filter.excludeRead) {
    exclude.read = true;
  }
  if (filter.excludeArchived) {
    exclude.archived = true;
  }

  const info: FolderInfo = {
    id: filter.id,
    name: filter.title.text,
    type: "custom",
    pinnedCount: filter.pinnedPeers.length,
    includedPeersCount: filter.includePeers.length,
    excludedPeersCount: filter.excludePeers.length,
  };

  if (filter.emoticon) {
    info.emoticon = filter.emoticon;
  }
  if (filter.color !== undefined) {
    info.color = filter.color;
  }
  if (Object.keys(includeAll).length > 0) {
    info.includeAll = includeAll;
  }
  if (Object.keys(exclude).length > 0) {
    info.exclude = exclude;
  }

  return info;
}

export async function fetchFolders(telegramClient: TelegramClient): Promise<FolderInfo[]> {
  const { filters } = await telegramClient.getFolders();

  return filters
    .map((filter) => mapDialogFilter(filter))
    .filter((folder): folder is FolderInfo => folder !== null);
}

export async function createTelegramFolder(
  telegramClient: TelegramClient,
  params: CreateFolderParams,
): Promise<FolderInfo> {
  const includePeers = params.includeChannels?.length
    ? await resolveInputPeers(telegramClient, params.includeChannels)
    : [];
  const excludePeers = params.excludeChannels?.length
    ? await resolveInputPeers(telegramClient, params.excludeChannels)
    : [];

  const folderParams: {
    title: tl.RawTextWithEntities;
    includePeers: tl.TypeInputPeer[];
    excludePeers: tl.TypeInputPeer[];
    emoticon?: string;
    contacts?: boolean;
    nonContacts?: boolean;
    groups?: boolean;
    broadcasts?: boolean;
    bots?: boolean;
    excludeMuted?: boolean;
    excludeRead?: boolean;
    excludeArchived?: boolean;
  } = {
    title: { _: "textWithEntities", text: params.name, entities: [] },
    includePeers,
    excludePeers,
  };

  if (params.emoticon) {
    folderParams.emoticon = params.emoticon;
  }
  if (params.includeAll?.contacts) {
    folderParams.contacts = true;
  }
  if (params.includeAll?.nonContacts) {
    folderParams.nonContacts = true;
  }
  if (params.includeAll?.groups) {
    folderParams.groups = true;
  }
  if (params.includeAll?.broadcasts) {
    folderParams.broadcasts = true;
  }
  if (params.includeAll?.bots) {
    folderParams.bots = true;
  }
  if (params.exclude?.muted) {
    folderParams.excludeMuted = true;
  }
  if (params.exclude?.read) {
    folderParams.excludeRead = true;
  }
  if (params.exclude?.archived) {
    folderParams.excludeArchived = true;
  }

  const created = await telegramClient.createFolder(folderParams);
  const mapped = mapDialogFilter(created);
  if (!mapped) {
    throw new Error("Failed to map created folder");
  }

  return mapped;
}
