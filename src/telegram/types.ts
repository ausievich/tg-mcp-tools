export type FolderRef = string | number;

export type DialogType = "channel" | "group" | "user";

export interface DialogInfo {
  id: string;
  name: string;
  type: DialogType;
  unreadCount: number;
  username?: string;
}

export interface MessageInfo {
  id: number;
  date: string;
  text: string;
  channelName: string;
  channelId: string;
  url: string;
  views?: number;
}

export type FolderType = "default" | "custom" | "chatlist";

export interface FolderInfo {
  id: number;
  name: string;
  type: FolderType;
  emoticon?: string;
  color?: number;
  includeAll?: {
    contacts?: boolean;
    nonContacts?: boolean;
    groups?: boolean;
    broadcasts?: boolean;
    bots?: boolean;
  };
  exclude?: {
    muted?: boolean;
    read?: boolean;
    archived?: boolean;
  };
  pinnedCount: number;
  includedPeersCount: number;
  excludedPeersCount?: number;
}

export interface CreateFolderParams {
  name: string;
  includeChannels?: string[];
  excludeChannels?: string[];
  emoticon?: string;
  includeAll?: FolderInfo["includeAll"];
  exclude?: FolderInfo["exclude"];
}
