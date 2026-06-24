import { z } from "zod";

export const channelIdsSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(100)
  .describe("List of @usernames or numeric ids");

export const folderSchema = z
  .union([z.string().min(1), z.number().int()])
  .describe("Folder id (e.g. 2) or folder name (e.g. Travel). Use tg_get_folders to list.");

export const minDateSchema = z
  .string()
  .min(1)
  .optional()
  .describe("Only messages on or after this date (ISO 8601, e.g. 2024-06-01 or 2024-06-01T00:00:00Z)");

export const maxDateSchema = z
  .string()
  .min(1)
  .optional()
  .describe("Only messages on or before this date (ISO 8601)");
