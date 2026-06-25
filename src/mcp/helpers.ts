import type { FetchMessagesOptions } from "../domains/messages/service.js";

export function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function parseMinDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid minDate: ${value}`);
  }

  return date;
}

export function buildFetchOptions(input: {
  sinceHours?: number;
  minDate?: string;
  beforeMessageId?: number;
  beforeMessageDate?: number;
  defaultSinceHours?: number;
}): FetchMessagesOptions {
  const options: FetchMessagesOptions = {};

  if (input.sinceHours !== undefined) {
    options.sinceHours = input.sinceHours;
  } else if (!input.minDate && input.defaultSinceHours !== undefined) {
    options.sinceHours = input.defaultSinceHours;
  }

  const minDate = parseMinDate(input.minDate);
  if (minDate) {
    options.minDate = minDate;
  }

  if (input.beforeMessageId !== undefined) {
    options.beforeMessageId = input.beforeMessageId;
  }

  if (input.beforeMessageDate !== undefined) {
    options.beforeMessageDate = input.beforeMessageDate;
  }

  return options;
}

export function wrapMessagesResponse(
  messages: Array<{ id: number; date: string }>,
): {
  messages: typeof messages;
  nextBeforeMessageId?: number;
  nextBeforeMessageDate?: number;
} {
  if (messages.length === 0) {
    return { messages };
  }

  const oldest = messages[messages.length - 1];
  if (!oldest) {
    return { messages };
  }

  return {
    messages,
    nextBeforeMessageId: oldest.id,
    nextBeforeMessageDate: Math.floor(new Date(oldest.date).getTime() / 1000),
  };
}
