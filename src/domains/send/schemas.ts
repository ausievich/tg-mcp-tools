import { z } from "zod";

export const sendMessageInput = {
  chatId: z
    .string()
    .min(1)
    .describe('Recipient: @username, numeric id, or "me" for Saved Messages'),
  text: z
    .string()
    .min(1)
    .max(50000)
    .describe("Message body. Use Markdown links like [label](https://t.me/...) for digests."),
  format: z
    .enum(["plain", "markdown", "html"])
    .optional()
    .describe('Formatting: "markdown" (default), "html", or "plain"'),
};
