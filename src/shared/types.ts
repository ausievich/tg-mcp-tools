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

export interface PostCommentInfo {
  id: number;
  date: string;
  text: string;
  senderName?: string;
}

export interface PostCommentsResult {
  post: MessageInfo;
  discussionChatName: string;
  discussionChatId: string;
  totalCount: number;
  comments: PostCommentInfo[];
  nextOffsetId?: number;
  nextOffsetDate?: number;
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

export interface EditFolderParams {
  name?: string;
  includeChannels?: string[];
  emoticon?: string;
}

export interface CreateChannelParams {
  title: string;
  description?: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  username?: string;
  url?: string;
}

export interface SimilarChannelInfo {
  id: string;
  name: string;
  username?: string;
  url?: string;
  basedOn?: string;
  totalAvailable?: number;
}

export type ChannelSearchSource = "name" | "posts";

export interface ChannelSearchMatch {
  date: string;
  text: string;
  url: string;
}

export interface ChannelSearchResult {
  id: string;
  name: string;
  type: "channel" | "group";
  username?: string;
  url?: string;
  memberCount?: number;
  source: ChannelSearchSource;
  matchedPost?: ChannelSearchMatch;
}

export type JoinChannelStatus = "joined" | "request_sent" | "webview";

export interface JoinChannelResult {
  status: JoinChannelStatus;
  channelId: string;
  id?: string;
  name?: string;
  username?: string;
  url?: string;
}
