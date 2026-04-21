export type Format = "MP4" | "MOV" | "MP3" | "WAV";

export type VideoQuality =
  | "2160p (4K)"
  | "1080p (Full HD)"
  | "720p"
  | "480p"
  | "360p";
export type MOVQuality = "2160p (4K ProRes)" | "1080p" | "720p" | "480p";
export type MP3Quality = "320 kbps" | "256 kbps" | "192 kbps" | "128 kbps";
export type WAVQuality = "24-bit Lossless" | "16-bit CD Quality";

export type Quality = VideoQuality | MOVQuality | MP3Quality | WAVQuality;

export type ItemStatus = "queued" | "downloading" | "complete" | "error";

export interface QueueItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  format: Format;
  quality: Quality;
  fileSize: string;
  fileSizeMB: number;
  status: ItemStatus;
  progress: number;
  index: number;
  /** Whether this item is selected for batch "Start" / bulk operations. */
  selected: boolean;
  error?: string;
  speed?: string;
  eta?: string;
  /** Absolute path to the completed file on the server's disk (local mode). */
  outputPath?: string;
  /** Short-lived token that authorizes GET /api/download-file?token=... */
  downloadToken?: string;
}
