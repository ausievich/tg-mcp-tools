import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const envFilePath = path.join(process.cwd(), ".env");

dotenv.config({ path: envFilePath });

const apiIdSchema = z
  .string()
  .min(1, "TELEGRAM_API_ID is required")
  .transform((value) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new Error("TELEGRAM_API_ID must be a number");
    }
    return parsed;
  });

const authEnvSchema = z.object({
  TELEGRAM_API_ID: apiIdSchema,
  TELEGRAM_API_HASH: z.string().min(1, "TELEGRAM_API_HASH is required"),
});

const envSchema = authEnvSchema.extend({
  TELEGRAM_SESSION: z.string().min(1, "TELEGRAM_SESSION is required"),
});

export type Config = z.infer<typeof envSchema>;

function formatEnvError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatEnvError(result.error)}`);
  }
  return result.data;
}

export function loadAuthConfig(): Pick<Config, "TELEGRAM_API_ID" | "TELEGRAM_API_HASH"> {
  const result = authEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatEnvError(result.error)}`);
  }
  return result.data;
}
