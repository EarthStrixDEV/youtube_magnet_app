export interface DownloadToken {
  filePath: string;
  fileName: string;
  createdAt: number;
}

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const tokens = new Map<string, DownloadToken>();

function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}

export function createToken(filePath: string): string {
  const token = crypto.randomUUID();
  tokens.set(token, {
    filePath,
    fileName: basename(filePath),
    createdAt: Date.now(),
  });
  return token;
}

export function resolveToken(token: string): DownloadToken | null {
  const entry = tokens.get(token);
  if (!entry) return null;

  if (Date.now() - entry.createdAt > TOKEN_EXPIRY_MS) {
    tokens.delete(token);
    return null;
  }

  return entry;
}

export function listExpired(now: number = Date.now()): DownloadToken[] {
  const expired: DownloadToken[] = [];
  for (const [token, entry] of tokens) {
    if (now - entry.createdAt > TOKEN_EXPIRY_MS) {
      tokens.delete(token);
      expired.push(entry);
    }
  }
  return expired;
}
