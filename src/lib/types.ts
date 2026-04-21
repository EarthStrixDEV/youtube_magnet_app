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

export type ItemStatus =
  | "queued"
  | "downloading"
  | "processing"
  | "complete"
  | "error";

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
  selected: boolean;
  error?: string;
  speed?: string;
  eta?: string;
  /** Free-form label shown under item while status==="processing" (e.g. "Merging..."). */
  processingLabel?: string;
}

// ---------------------------------------------------------------------------
// /api/get-streams contract
// ---------------------------------------------------------------------------

export type GetStreamsRequest = { url: string; format: Format; quality: Quality };

export type TranscodeTargetFormat = "mp3" | "wav";

interface GetStreamsBase {
  ok: true;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  thumbnail: string;
  duration: string;
}

export interface GetStreamsSingle extends GetStreamsBase {
  kind: "single";
  downloadUrl: string;
}

export interface GetStreamsMerge extends GetStreamsBase {
  kind: "merge";
  videoUrl: string;
  videoMime: string;
  audioUrl: string;
  audioMime: string;
}

export interface GetStreamsTranscode extends GetStreamsBase {
  kind: "transcode";
  audioUrl: string;
  audioMime: string;
  targetFormat: TranscodeTargetFormat;
  /** Passed to ffmpeg as -b:a value (MP3 only), e.g. "320k". Omitted for WAV. */
  targetBitrate?: string;
  /** WAV only: PCM codec, e.g. "pcm_s16le" / "pcm_s24le". */
  targetCodec?: string;
  /** WAV 16-bit only: sample rate override, e.g. 44100. */
  targetSampleRate?: number;
}

export type GetStreamsSuccess =
  | GetStreamsSingle
  | GetStreamsMerge
  | GetStreamsTranscode;

export type GetStreamsError = {
  ok: false;
  code: "phase2_only" | "invalid_url" | "network_error" | "no_stream" | "unknown";
  message: string;
};

export type GetStreamsResponse = GetStreamsSuccess | GetStreamsError;
