import { TelegramClient, html, md, type InputText } from "@mtcute/node";
import { normalizeChannelRef } from "../../shared/peers.js";

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

export type MessageFormat = "plain" | "markdown" | "html";

export interface SendMessageOptions {
  format?: MessageFormat;
}

export interface SendMessageResult {
  chatId: string;
  format: MessageFormat;
  messageCount: number;
  messageIds: number[];
}

function splitSourceText(text: string, maxLength = TELEGRAM_MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitAt = remaining.lastIndexOf("\n\n", maxLength);
    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf("\n", maxLength);
    }
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

function parseFormattedText(text: string, format: MessageFormat): InputText {
  switch (format) {
    case "markdown":
      return md(text);
    case "html":
      return html(text);
    default:
      return text;
  }
}

function toMessageParts(text: string, format: MessageFormat): InputText[] {
  return splitSourceText(text).map((chunk) => parseFormattedText(chunk, format));
}

export async function sendTelegramMessage(
  telegramClient: TelegramClient,
  chatId: string,
  text: string,
  options: SendMessageOptions = {},
): Promise<SendMessageResult> {
  const format = options.format ?? "markdown";
  const peerRef = normalizeChannelRef(chatId);
  const parts = toMessageParts(text, format);
  const messageIds: number[] = [];

  for (const part of parts) {
    const message = await telegramClient.sendText(peerRef, part);
    messageIds.push(message.id);
  }

  return {
    chatId: chatId.trim(),
    format,
    messageCount: messageIds.length,
    messageIds,
  };
}
