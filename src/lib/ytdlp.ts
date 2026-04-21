import { spawn, execFile, execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import type { Format, Quality } from "./types";

// Cached yt-dlp version string — queried once at first fetchRealMeta call
let _ytdlpVersion: string | null = null;

async function getYtdlpVersion(): Promise<string> {
  if (_ytdlpVersion) return _ytdlpVersion;
  const ytdlpPath = getYtdlpPath();
  if (!ytdlpPath) return "unknown";
  return new Promise((resolve) => {
    execFile(ytdlpPath, ["--version"], (err, stdout) => {
      _ytdlpVersion = err ? "unknown" : stdout.trim();
      resolve(_ytdlpVersion);
    });
  });
}

// Resolve tool paths: env var → system PATH → scan known install locations
let _ytdlpPath: string | null = null;
let _ffmpegDir: string | null = null;

function which(cmd: string): string | null {
  try {
    const isWin = process.platform === "win32";
    const result = execFileSync(isWin ? "where" : "which", [cmd], {
      encoding: "utf-8",
      timeout: 5000,
    });
    const firstLine = result.trim().split("\n")[0].trim();
    return firstLine || null;
  } catch {
    return null;
  }
}

function firstExisting(candidates: string[]): string | null {
  for (const c of candidates) {
    if (!c) continue;
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return null;
}

export function getYtdlpPath(): string | null {
  if (_ytdlpPath) return _ytdlpPath;

  // 1. Env var (verified)
  if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
    _ytdlpPath = process.env.YTDLP_PATH;
    return _ytdlpPath;
  }

  // 2. System PATH (verified by the shell's `where`/`which`)
  const found = which("yt-dlp");
  if (found) {
    _ytdlpPath = found;
    return _ytdlpPath;
  }

  // 3. Scan known Python install locations (Windows pip --user installs)
  const appdata = process.env.APPDATA || "";
  const localAppData = process.env.LOCALAPPDATA || "";
  const pythonVersions = ["Python314", "Python313", "Python312", "Python311", "Python310", "Python39"];
  const candidates: string[] = [];
  for (const ver of pythonVersions) {
    if (appdata) {
      candidates.push(path.join(appdata, "Python", ver, "Scripts", "yt-dlp.exe"));
    }
    if (localAppData) {
      candidates.push(path.join(localAppData, "Programs", "Python", ver, "Scripts", "yt-dlp.exe"));
    }
  }

  const scanned = firstExisting(candidates);
  if (scanned) {
    _ytdlpPath = scanned;
    return _ytdlpPath;
  }

  return null;
}

export function getFfmpegDir(): string | null {
  if (_ffmpegDir) return _ffmpegDir;

  // 1. Env var (verified)
  if (process.env.FFMPEG_DIR && fs.existsSync(path.join(process.env.FFMPEG_DIR, "ffmpeg.exe"))) {
    _ffmpegDir = process.env.FFMPEG_DIR;
    return _ffmpegDir;
  }

  // 2. System PATH
  const found = which("ffmpeg");
  if (found) {
    _ffmpegDir = path.dirname(found);
    return _ffmpegDir;
  }

  // 3. Scan common Windows install locations
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
  const candidates: string[] = [];
  if (localAppData) {
    // WinGet installs — wildcarded version matches any build
    const wingetBase = path.join(localAppData, "Microsoft", "WinGet", "Packages");
    try {
      if (fs.existsSync(wingetBase)) {
        for (const entry of fs.readdirSync(wingetBase)) {
          if (entry.startsWith("Gyan.FFmpeg_")) {
            const pkgDir = path.join(wingetBase, entry);
            try {
              for (const sub of fs.readdirSync(pkgDir)) {
                const binDir = path.join(pkgDir, sub, "bin");
                candidates.push(path.join(binDir, "ffmpeg.exe"));
              }
            } catch {}
          }
        }
      }
    } catch {}
  }
  // Chocolatey + manual installs
  candidates.push(path.join(programFiles, "ffmpeg", "bin", "ffmpeg.exe"));
  candidates.push("C:\\ffmpeg\\bin\\ffmpeg.exe");

  const scanned = firstExisting(candidates);
  if (scanned) {
    _ffmpegDir = path.dirname(scanned);
    return _ffmpegDir;
  }

  return null;
}

// Map height from quality string
function getHeightFromQuality(quality: Quality): number {
  const match = quality.match(/(\d+)p/);
  return match ? parseInt(match[1], 10) : 1080;
}

// Map bitrate from quality string
function getBitrateFromQuality(quality: Quality): string {
  const match = quality.match(/(\d+)\s*kbps/);
  return match ? `${match[1]}K` : "192K";
}

// Bot-detection resilience args — try multiple player clients in order
// mweb/tv often bypass data-center IP blocks; ios/web_safari as further fallbacks
const EXTRACTOR_RESILIENCE_ARGS = [
  "--extractor-args", "youtube:player_client=mweb,tv,ios,web_safari",
  "--retries", "3",
  "--fragment-retries", "3",
  "--no-warnings",
  ...(process.env.YTDLP_COOKIES_FILE
    ? ["--cookies", process.env.YTDLP_COOKIES_FILE]
    : []),
];

export function buildYtdlpArgs(
  url: string,
  format: Format,
  quality: Quality,
  outputDir: string
): string[] {
  const outputTemplate = path.join(outputDir, "%(title)s [%(id)s].%(ext)s");
  const ffmpegDir = getFfmpegDir();
  const baseArgs = [
    "--newline",
    "--no-colors",
    "--no-playlist",
    ...EXTRACTOR_RESILIENCE_ARGS,
    ...(ffmpegDir ? ["--ffmpeg-location", ffmpegDir] : []),
    "-o", outputTemplate,
  ];

  switch (format) {
    case "MP4": {
      const h = getHeightFromQuality(quality);
      return [
        ...baseArgs,
        "-f", `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`,
        "--merge-output-format", "mp4",
        url,
      ];
    }
    case "MOV": {
      const h = getHeightFromQuality(quality);
      return [
        ...baseArgs,
        "-f", `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`,
        "--merge-output-format", "mov",
        url,
      ];
    }
    case "MP3": {
      const bitrate = getBitrateFromQuality(quality);
      return [
        ...baseArgs,
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", bitrate,
        url,
      ];
    }
    case "WAV": {
      const is24bit = quality.includes("24");
      const ppArgs = is24bit
        ? "-acodec pcm_s24le"
        : "-acodec pcm_s16le -ar 44100";
      return [
        ...baseArgs,
        "-x",
        "--audio-format", "wav",
        "--postprocessor-args", `ffmpeg:${ppArgs}`,
        url,
      ];
    }
    default:
      return [...baseArgs, url];
  }
}

// Parse yt-dlp progress output line
export interface ProgressInfo {
  percent: number;
  speed: string;
  eta: string;
  totalSize?: string;
}

export function parseProgress(line: string): ProgressInfo | null {
  // Match: [download]  45.2% of  120.50MiB at  3.21MiB/s ETA 00:21
  // Also:  [download]  45.2% of ~ 120.50MiB at  3.21MiB/s ETA 00:21
  const match = line.match(
    /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\w+)\s+at\s+([\d.]+\s*\w+\/s)\s+ETA\s+([\d:]+)/
  );
  if (match) {
    return {
      percent: parseFloat(match[1]),
      totalSize: match[2].trim(),
      speed: match[3].trim(),
      eta: match[4].trim(),
    };
  }

  // Match simpler: [download]  100% of  120.50MiB
  const matchDone = line.match(
    /\[download\]\s+100%\s+of\s+~?\s*([\d.]+\s*\w+)/
  );
  if (matchDone) {
    return {
      percent: 100,
      totalSize: matchDone[1].trim(),
      speed: "",
      eta: "00:00",
    };
  }

  return null;
}

// Detect post-processing phases
export function isPostProcessing(line: string): boolean {
  return (
    line.includes("[Merger]") ||
    line.includes("[ExtractAudio]") ||
    line.includes("[ffmpeg]") ||
    line.includes("[FixupM3u8]")
  );
}

// Detect destination filename from yt-dlp output
export function parseDestination(line: string): string | null {
  // [Merger] Merging formats into "path/file.mp4"
  const mergerMatch = line.match(/\[Merger\] Merging formats into "(.+)"/);
  if (mergerMatch) return mergerMatch[1];

  // [download] Destination: path/file.mp4
  const destMatch = line.match(/\[download\] Destination:\s*(.+)/);
  if (destMatch) return destMatch[1].trim();

  // [ExtractAudio] Destination: path/file.mp3
  const audioMatch = line.match(/\[ExtractAudio\] Destination:\s*(.+)/);
  if (audioMatch) return audioMatch[1].trim();

  return null;
}

// Fetch real metadata via yt-dlp --dump-json
export async function fetchRealMeta(
  url: string
): Promise<{ title: string; duration: string; thumbnail: string; fileSizeMB: number }> {
  const ytdlpPath = getYtdlpPath();
  if (!ytdlpPath) {
    throw new Error("yt-dlp not found. Install with: pip install yt-dlp");
  }

  const ffmpegDir = getFfmpegDir();
  const args = [
    "--dump-json",
    "--no-download",
    "--no-playlist",
    ...EXTRACTOR_RESILIENCE_ARGS,
    ...(ffmpegDir ? ["--ffmpeg-location", ffmpegDir] : []),
    url,
  ];

  const ytdlpVersion = await getYtdlpVersion();

  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        // Extract the most actionable error line from stderr
        const firstErrorLine = stderr
          .split("\n")
          .find((l) => l.includes("ERROR:") || l.includes("WARNING:"))
          ?.trim();
        const clientMessage = firstErrorLine || stderr.trim() || error.message;

        console.error("[ytdlp] fetchRealMeta failed", {
          ytdlpVersion,
          url,
          args,
          exitCode: (error as NodeJS.ErrnoException).code ?? "unknown",
          stderr: stderr.trim(),
          errorMessage: error.message,
        });

        reject(new Error(clientMessage));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const durationSec = data.duration || 0;
        const mins = Math.floor(durationSec / 60);
        const secs = Math.floor(durationSec % 60);
        const duration =
          durationSec >= 3600
            ? `${Math.floor(durationSec / 3600)}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
            : `${mins}:${String(secs).padStart(2, "0")}`;

        // Estimate file size from available info
        let fileSizeMB = 0;
        if (data.filesize_approx) {
          fileSizeMB = Math.round(data.filesize_approx / (1024 * 1024));
        } else if (data.filesize) {
          fileSizeMB = Math.round(data.filesize / (1024 * 1024));
        } else if (data.requested_formats) {
          const total = data.requested_formats.reduce(
            (sum: number, f: { filesize?: number; filesize_approx?: number }) =>
              sum + (f.filesize || f.filesize_approx || 0),
            0
          );
          fileSizeMB = Math.round(total / (1024 * 1024));
        }

        resolve({
          title: data.title || "Untitled Video",
          duration,
          thumbnail: data.thumbnail || "",
          fileSizeMB,
        });
      } catch {
        console.error("[ytdlp] fetchRealMeta: failed to parse JSON output", {
          ytdlpVersion,
          url,
          stdoutPreview: stdout.slice(0, 500),
        });
        reject(new Error("Failed to parse yt-dlp JSON output"));
      }
    });
  });
}

// Spawn yt-dlp process for downloading
export function spawnDownload(
  url: string,
  format: Format,
  quality: Quality,
  outputDir: string
) {
  const ytdlpPath = getYtdlpPath();
  if (!ytdlpPath) {
    throw new Error("yt-dlp not found. Install with: pip install yt-dlp");
  }
  const args = buildYtdlpArgs(url, format, quality, outputDir);

  const proc = spawn(ytdlpPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  return proc;
}

// Check if yt-dlp and ffmpeg are available
export async function checkToolHealth(): Promise<{
  ytdlp: boolean;
  ffmpeg: boolean;
  ytdlpVersion?: string;
  ffmpegVersion?: string;
  ytdlpPath?: string;
  ffmpegPath?: string;
}> {
  const result: {
    ytdlp: boolean;
    ffmpeg: boolean;
    ytdlpVersion?: string;
    ffmpegVersion?: string;
    ytdlpPath?: string;
    ffmpegPath?: string;
  } = { ytdlp: false, ffmpeg: false };

  const ytdlpPath = getYtdlpPath();
  if (ytdlpPath) {
    result.ytdlpPath = ytdlpPath;
    try {
      const ytVer = await new Promise<string>((resolve, reject) => {
        execFile(ytdlpPath, ["--version"], (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout.trim());
        });
      });
      result.ytdlp = true;
      result.ytdlpVersion = ytVer;
    } catch (err) {
      console.error("[health] yt-dlp exec failed:", ytdlpPath, err instanceof Error ? err.message : err);
    }
  } else {
    console.error("[health] yt-dlp not found — checked YTDLP_PATH, system PATH, and %APPDATA%\\Python\\Python3xx\\Scripts");
  }

  const ffmpegDir = getFfmpegDir();
  if (ffmpegDir) {
    const ffmpegPath = path.join(ffmpegDir, "ffmpeg.exe");
    result.ffmpegPath = ffmpegPath;
    try {
      const ffVer = await new Promise<string>((resolve, reject) => {
        execFile(ffmpegPath, ["-version"], (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout.split("\n")[0].trim());
        });
      });
      result.ffmpeg = true;
      result.ffmpegVersion = ffVer;
    } catch (err) {
      console.error("[health] ffmpeg exec failed:", ffmpegPath, err instanceof Error ? err.message : err);
    }
  } else {
    console.error("[health] ffmpeg not found — checked FFMPEG_DIR, system PATH, and WinGet package dir");
  }

  return result;
}
