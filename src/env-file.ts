import fs from "node:fs/promises";

function quoteEnvValue(value: string): string {
  if (/[\s#'"\\]/.test(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

export async function updateEnvFileVariable(
  envPath: string,
  key: string,
  value: string,
): Promise<void> {
  let content: string;
  try {
    content = await fs.readFile(envPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`.env not found at ${envPath}. Create it from .env.example first.`);
    }
    throw error;
  }

  const line = `${key}=${quoteEnvValue(value)}`;
  const pattern = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=.*$`, "m");

  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    if (content.length > 0 && !content.endsWith("\n")) {
      content += "\n";
    }
    content += `${line}\n`;
  }

  await fs.writeFile(envPath, content, "utf8");
}
