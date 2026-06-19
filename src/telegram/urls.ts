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
