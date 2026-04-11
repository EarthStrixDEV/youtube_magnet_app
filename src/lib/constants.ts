import type {
  Format,
  Quality,
  VideoQuality,
  MOVQuality,
  MP3Quality,
  WAVQuality,
} from "./types";

export const FORMAT_OPTIONS: Format[] = ["MP4", "MOV", "MP3", "WAV"];

export const QUALITY_MAP: Record<Format, Quality[]> = {
  MP4: [
    "2160p (4K)",
    "1080p (Full HD)",
    "720p",
    "480p",
    "360p",
  ] as VideoQuality[],
  MOV: [
    "2160p (4K ProRes)",
    "1080p",
    "720p",
    "480p",
  ] as MOVQuality[],
  MP3: [
    "320 kbps",
    "256 kbps",
    "192 kbps",
    "128 kbps",
  ] as MP3Quality[],
  WAV: [
    "24-bit Lossless",
    "16-bit CD Quality",
  ] as WAVQuality[],
};

export const DEFAULT_FORMAT: Format = "MP4";
export const DEFAULT_QUALITY: Quality = "1080p (Full HD)";
export const DEFAULT_WORKERS = 3;
export const MIN_WORKERS = 1;
export const MAX_WORKERS = 8;

// Extract video ID from a YouTube URL
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Get high-quality thumbnail directly from video ID (no API needed)
export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatFileSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

// YouTube URL patterns
const YT_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
  /(?:https?:\/\/)?youtu\.be\/[\w-]+/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/,
];

export function isValidYouTubeUrl(url: string): boolean {
  return YT_PATTERNS.some((pattern) => pattern.test(url.trim()));
}

export function parseUrls(input: string): string[] {
  return input
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter(isValidYouTubeUrl);
}
