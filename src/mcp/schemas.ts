import { z } from "zod";

/** Used across messages, channels, subscriptions, and folders tools. */
export const folderSchema = z
  .union([z.string().min(1), z.number().int()])
  .describe("Folder id (e.g. 2) or folder name (e.g. Travel). Use tg_get_folders to list.");
