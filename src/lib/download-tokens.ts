import fs from "fs";
import path from "path";
import { createToken as storeCreateToken, listExpired } from "./token-store";

export { isServerMode } from "./deployment-mode";
export { resolveToken } from "./token-store";
export type { DownloadToken } from "./token-store";

function getSystemTmpDir(): string {
  return (
    process.env.TMPDIR ||
    process.env.TEMP ||
    process.env.TMP ||
    (process.platform === "win32" ? "C:\\Windows\\Temp" : "/tmp")
  );
}

let _tempDir: string | null = null;
function resolveTempDir(): string {
  if (_tempDir) return _tempDir;
  _tempDir =
    process.env.DOWNLOAD_DIR ||
    path.join(getSystemTmpDir(), "ytmagnet-downloads");
  return _tempDir;
}

export function getTempDownloadDir(): string {
  const dir = resolveTempDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function createToken(filePath: string): string {
  const token = storeCreateToken(filePath);
  ensureCleanupScheduled();
  return token;
}

export function cleanupExpired(): number {
  const expired = listExpired();
  let cleaned = 0;
  for (const entry of expired) {
    try {
      if (fs.existsSync(entry.filePath)) {
        fs.unlinkSync(entry.filePath);
        cleaned++;
      }
    } catch {}
  }
  return cleaned;
}

let _cleanupTimer: NodeJS.Timeout | null = null;
function ensureCleanupScheduled(): void {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(cleanupExpired, 15 * 60 * 1000);
  _cleanupTimer.unref?.();
}
