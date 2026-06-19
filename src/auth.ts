#!/usr/bin/env node
import { MemoryStorage, TelegramClient } from "@mtcute/node";
import qrcode from "qrcode-terminal";
import { envFilePath, loadAuthConfig } from "./config.js";
import { updateEnvFileVariable } from "./env-file.js";

function printQr(url: string, expires: Date): void {
  console.log(`\nScan before ${expires.toISOString()}:`);
  qrcode.generate(url, { small: true });
  console.log(`\nOr open manually:\n${url}\n`);
}

async function main(): Promise<void> {
  const { TELEGRAM_API_ID, TELEGRAM_API_HASH } = loadAuthConfig();

  const client = new TelegramClient({
    apiId: TELEGRAM_API_ID,
    apiHash: TELEGRAM_API_HASH,
    storage: new MemoryStorage(),
  });

  console.log(
    "On phone: Telegram → Settings → Devices → Link Desktop Device → scan QR below.\n",
  );

  await client.start({
    qrCodeHandler: printQr,
    password: async () => (await client.input("2FA password: ")).trim(),
  });

  const session = await client.exportSession();
  await updateEnvFileVariable(envFilePath, "TELEGRAM_SESSION", session);
  console.log(`\nAuthorization successful. TELEGRAM_SESSION saved to ${envFilePath}\n`);

  await client.destroy();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Authorization failed: ${message}`);
  process.exit(1);
});
