import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { NodePlatform } from "@mtcute/node";

let cachedDeviceModel: string | null = null;

function normalizeDeviceModel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function readDmiValue(path: string): string | null {
  try {
    const value = normalizeDeviceModel(readFileSync(path, "utf8"));
    return value || null;
  } catch {
    return null;
  }
}

function getWindowsDeviceModel(): string | null {
  try {
    const script =
      "(Get-CimInstance Win32_ComputerSystem).Manufacturer + ' ' + (Get-CimInstance Win32_ComputerSystem).Model";
    const output = normalizeDeviceModel(
      execSync(`powershell -NoProfile -Command ${JSON.stringify(script)}`, {
        encoding: "utf8",
        timeout: 5000,
        windowsHide: true,
      }),
    );
    return output || null;
  } catch {
    return null;
  }
}

function getMacDeviceModel(): string | null {
  try {
    const output = normalizeDeviceModel(
      execSync("sysctl -n hw.model", { encoding: "utf8", timeout: 3000 }),
    );
    return output || null;
  } catch {
    return null;
  }
}

function getLinuxDeviceModel(): string | null {
  const vendor = readDmiValue("/sys/class/dmi/id/sys_vendor");
  const product = readDmiValue("/sys/class/dmi/id/product_name");
  const combined = normalizeDeviceModel([vendor, product].filter(Boolean).join(" "));
  return combined || null;
}

function detectHostDeviceModel(): string {
  const platformModel =
    process.platform === "win32"
      ? getWindowsDeviceModel()
      : process.platform === "darwin"
        ? getMacDeviceModel()
        : process.platform === "linux"
          ? getLinuxDeviceModel()
          : null;

  if (platformModel) {
    return platformModel;
  }

  return new NodePlatform().getDeviceModel();
}

export function getHostDeviceModel(): string {
  cachedDeviceModel ??= detectHostDeviceModel();
  return cachedDeviceModel;
}
