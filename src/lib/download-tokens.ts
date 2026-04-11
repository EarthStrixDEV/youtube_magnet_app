import fs from "fs";
import path from "path";
import os from "os";

export interface DownloadToken {
  filePath: string;
  fileName: string;
  createdAt: number;
}

// In-memory token map with expiry (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const tokens = new Map<string, DownloadToken>();

// Server-side temp directory for downloads
const TEMP_DIR = process.env.DOWNLOAD_DIR || path.join(os.tmpdir(), "ytmagnet-downloads");

export function getTempDownloadDir(): string {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

export function createToken(filePath: string): string {
  const token = crypto.randomUUID();
  const fileName = path.basename(filePath);
  tokens.set(token, { filePath, fileName, createdAt: Date.now() });
  return token;
}

export function resolveToken(token: string): DownloadToken | null {
  const entry = tokens.get(token);
  if (!entry) return null;

  // Check expiry
  if (Date.now() - entry.createdAt > TOKEN_EXPIRY_MS) {
    tokens.delete(token);
    return null;
  }

  return entry;
}

export function isServerMode(): boolean {
  return process.env.DEPLOYMENT_MODE === "server";
}

// Cleanup expired tokens and their files
export function cleanupExpired(): number {
  let cleaned = 0;
  const now = Date.now();
  for (const [token, entry] of tokens) {
    if (now - entry.createdAt > TOKEN_EXPIRY_MS) {
      tokens.delete(token);
      try {
        if (fs.existsSync(entry.filePath)) {
          fs.unlinkSync(entry.filePath);
          cleaned++;
        }
      } catch {}
    }
  }
  return cleaned;
}

// Run cleanup every 15 minutes
setInterval(cleanupExpired, 15 * 60 * 1000);
