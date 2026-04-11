import { spawn, execFile, execFileSync } from "child_process";
import path from "path";
import type { Format, Quality } from "./types";

// Resolve tool paths: env var → system PATH → legacy hardcoded fallback
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

export function getYtdlpPath(): string {
  if (_ytdlpPath) return _ytdlpPath;

  // 1. Env var
  if (process.env.YTDLP_PATH) {
    _ytdlpPath = process.env.YTDLP_PATH;
    return _ytdlpPath;
  }

  // 2. System PATH
  const found = which("yt-dlp");
  if (found) {
    _ytdlpPath = found;
    return _ytdlpPath;
  }

  // 3. Legacy fallback (Windows dev machine)
  const legacy = path.join(
    process.env.APPDATA || "",
    "Python/Python310/Scripts/yt-dlp.exe"
  );
  _ytdlpPath = legacy;
  return _ytdlpPath;
}

export function getFfmpegDir(): string {
  if (_ffmpegDir) return _ffmpegDir;

  // 1. Env var
  if (process.env.FFMPEG_DIR) {
    _ffmpegDir = process.env.FFMPEG_DIR;
    return _ffmpegDir;
  }

  // 2. System PATH — find ffmpeg binary, return its directory
  const found = which("ffmpeg");
  if (found) {
    _ffmpegDir = path.dirname(found);
    return _ffmpegDir;
  }

  // 3. Legacy fallback (Windows WinGet)
  _ffmpegDir = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin"
  );
  return _ffmpegDir;
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

export function buildYtdlpArgs(
  url: string,
  format: Format,
  quality: Quality,
  outputDir: string
): string[] {
  const outputTemplate = path.join(outputDir, "%(title)s [%(id)s].%(ext)s");
  const baseArgs = [
    "--newline",
    "--no-colors",
    "--no-playlist",
    "--ffmpeg-location", getFfmpegDir(),
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
export function fetchRealMeta(
  url: string
): Promise<{ title: string; duration: string; thumbnail: string; fileSizeMB: number }> {
  return new Promise((resolve, reject) => {
    const ytdlpPath = getYtdlpPath();
    const args = [
      "--dump-json",
      "--no-download",
      "--no-warnings",
      "--no-playlist",
      "--ffmpeg-location", getFfmpegDir(),
      url,
    ];

    let stdout = "";
    let stderr = "";

    const proc = execFile(ytdlpPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, out, err) => {
      stdout = out;
      stderr = err;

      if (error) {
        reject(new Error(stderr || error.message));
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
}> {
  const result = { ytdlp: false, ffmpeg: false, ytdlpVersion: undefined as string | undefined, ffmpegVersion: undefined as string | undefined };

  try {
    const ytdlpPath = getYtdlpPath();
    const ytVer = await new Promise<string>((resolve, reject) => {
      execFile(ytdlpPath, ["--version"], (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
    });
    result.ytdlp = true;
    result.ytdlpVersion = ytVer;
  } catch {}

  try {
    const ffmpegPath = path.join(getFfmpegDir(), "ffmpeg.exe");
    const ffVer = await new Promise<string>((resolve, reject) => {
      execFile(ffmpegPath, ["-version"], (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.split("\n")[0].trim());
      });
    });
    result.ffmpeg = true;
    result.ffmpegVersion = ffVer;
  } catch {}

  return result;
}
