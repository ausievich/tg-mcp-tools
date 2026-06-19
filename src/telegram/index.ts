export { archiveChats, unarchiveChats } from "./chats.js";
export { getTelegramClient } from "./client.js";
export { createTelegramFolder, editTelegramFolder, fetchFolders } from "./folders.js";
export { fetchDialogs } from "./dialogs.js";
export {
  fetchMessages,
  fetchRecentFromChannels,
  fetchRecentFromFolder,
} from "./messages.js";
export { sendTelegramMessage } from "./send.js";
export {
  getDialogType,
  getPeerId,
  getPeerName,
  getPeerUsername,
  normalizeChannelRef,
  normalizeFolderRef,
} from "./peers.js";
export { buildTelegramPostUrl } from "./urls.js";
export type {
  CreateFolderParams,
  EditFolderParams,
  DialogInfo,
  DialogType,
  FolderInfo,
  FolderRef,
  FolderType,
  MessageInfo,
} from "./types.js";
export type { MessageFormat, SendMessageOptions, SendMessageResult } from "./send.js";
