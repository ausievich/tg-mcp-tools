export function buildTelegramPostUrl(
  messageId: number,
  channelId: string,
  username?: string,
): string {
  if (username) {
    return `https://t.me/${username}/${messageId}`;
  }
  const internalId = channelId.replace(/^-100/, "");
  return `https://t.me/c/${internalId}/${messageId}`;
}

export interface ParsedTelegramPostUrl {
  channelRef: string;
  messageId: number;
  url: string;
}

export function parseTelegramPostUrl(input: string): ParsedTelegramPostUrl {
  const trimmed = input.trim();
  const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  let parsed: URL;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`Invalid Telegram post URL: ${input}`);
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "t.me" && host !== "telegram.me") {
    throw new Error(`Not a Telegram post URL: ${input}`);
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] !== "c") {
    const messageId = Number.parseInt(parts[1]!, 10);
    if (Number.isNaN(messageId) || messageId <= 0) {
      throw new Error(`Invalid message id in URL: ${input}`);
    }

    const username = parts[0]!;
    return {
      channelRef: `@${username}`,
      messageId,
      url: buildTelegramPostUrl(messageId, "", username),
    };
  }

  if (parts.length === 3 && parts[0] === "c") {
    const messageId = Number.parseInt(parts[2]!, 10);
    if (Number.isNaN(messageId) || messageId <= 0) {
      throw new Error(`Invalid message id in URL: ${input}`);
    }

    const channelId = `-100${parts[1]!}`;
    return {
      channelRef: channelId,
      messageId,
      url: buildTelegramPostUrl(messageId, channelId),
    };
  }

  throw new Error(`Expected t.me/username/id or t.me/c/channelId/id: ${input}`);
}
