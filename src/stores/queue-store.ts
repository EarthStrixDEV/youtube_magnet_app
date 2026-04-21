import { create } from "zustand";
import type { Format, Quality, QueueItem } from "@/lib/types";
import {
  DEFAULT_FORMAT,
  DEFAULT_QUALITY,
  DEFAULT_WORKERS,
  QUALITY_MAP,
  extractVideoId,
  getThumbnailUrl,
  formatFileSize,
  parseUrls,
} from "@/lib/constants";
import { getT } from "@/hooks/use-t";
import { useLocaleStore } from "@/stores/locale-store";

interface QueueStore {
  items: QueueItem[];
  globalFormat: Format;
  globalQuality: Quality;
  parallelWorkers: number;
  isDownloading: boolean;
  nextIndex: number;
  downloadDir: string;
  deploymentMode: "local" | "server";

  // Actions
  addUrls: (raw: string) => number;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  updateItemFormat: (id: string, format: Format) => void;
  updateItemQuality: (id: string, quality: Quality) => void;
  updateItemProgress: (id: string, progress: number) => void;
  markItemStatus: (id: string, status: QueueItem["status"]) => void;
  markItemError: (id: string, error: string) => void;
  setGlobalFormat: (format: Format) => void;
  setGlobalQuality: (quality: Quality) => void;
  setParallelWorkers: (n: number) => void;
  setIsDownloading: (v: boolean) => void;
  setDownloadDir: (dir: string) => void;
  setDeploymentMode: (mode: "local" | "server") => void;
  getNextQueued: () => QueueItem | undefined;
  clearCompleted: () => void;
  clearQueue: () => void;
  toggleItemSelected: (id: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  items: [],
  globalFormat: DEFAULT_FORMAT,
  globalQuality: DEFAULT_QUALITY,
  parallelWorkers: DEFAULT_WORKERS,
  isDownloading: false,
  nextIndex: 1,
  downloadDir: "",
  deploymentMode: "local",

  addUrls: (raw: string) => {
    const urls = parseUrls(raw);
    if (urls.length === 0) return 0;

    const { globalFormat, globalQuality, nextIndex } = get();

    // Create items immediately with placeholder data, then fetch real metadata
    const t = getT(useLocaleStore.getState().locale);
    const newItems: QueueItem[] = urls.map((url, i) => {
      const videoId = extractVideoId(url);

      return {
        id: crypto.randomUUID(),
        url,
        title: t("placeholder.loading"),
        thumbnail: videoId ? getThumbnailUrl(videoId) : "",
        duration: t("placeholder.duration"),
        format: globalFormat,
        quality: globalQuality,
        fileSize: t("placeholder.fileSize"),
        fileSizeMB: 0,
        status: "queued" as const,
        progress: 0,
        index: nextIndex + i,
        selected: true,
      };
    });

    set((s) => ({
      items: [...s.items, ...newItems],
      nextIndex: s.nextIndex + newItems.length,
    }));

    // Fetch real metadata in background for each item via yt-dlp
    newItems.forEach((item) => {
      fetch(`/api/video-info?url=${encodeURIComponent(item.url)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((meta: { title: string; duration: string; thumbnail: string; fileSizeMB: number }) => {
          const store = get();
          if (store.items.some((i) => i.id === item.id)) {
            set((s) => ({
              items: s.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      title: meta.title || i.title,
                      thumbnail: meta.thumbnail || i.thumbnail,
                      duration: meta.duration || i.duration,
                      fileSizeMB: meta.fileSizeMB || 0,
                      fileSize: meta.fileSizeMB ? formatFileSize(meta.fileSizeMB) : "...",
                    }
                  : i
              ),
            }));
          }
        })
        .catch(() => {
          // Fallback: keep placeholder data
        });
    });

    return newItems.length;
  },

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((item) => item.id !== id) })),

  updateItem: (id, updates) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  updateItemFormat: (id, format) =>
    set((s) => ({
      items: s.items.map((item) => {
        if (item.id !== id) return item;
        const qualities = QUALITY_MAP[format];
        const quality = qualities[0];
        return { ...item, format, quality };
      }),
    })),

  updateItemQuality: (id, quality) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, quality } : item
      ),
    })),

  updateItemProgress: (id, progress) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, progress } : item
      ),
    })),

  markItemStatus: (id, status) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id
          ? { ...item, status, progress: status === "complete" ? 100 : item.progress }
          : item
      ),
    })),

  markItemError: (id, error) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id
          ? { ...item, status: "error" as const, error }
          : item
      ),
    })),

  setGlobalFormat: (format) => {
    const qualities = QUALITY_MAP[format];
    set({ globalFormat: format, globalQuality: qualities[0] });
  },

  setGlobalQuality: (quality) => set({ globalQuality: quality }),

  setParallelWorkers: (n) =>
    set({ parallelWorkers: Math.max(1, Math.min(8, n)) }),

  setIsDownloading: (v) => set({ isDownloading: v }),

  setDownloadDir: (dir) => set({ downloadDir: dir }),

  setDeploymentMode: (mode) => set({ deploymentMode: mode }),

  getNextQueued: () => get().items.find((item) => item.status === "queued"),

  clearCompleted: () =>
    set((s) => ({
      items: s.items.filter((item) => item.status !== "complete"),
    })),

  clearQueue: () => set({ items: [], nextIndex: 1, isDownloading: false }),

  toggleItemSelected: (id) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      ),
    })),

  selectAllItems: () =>
    set((s) => ({
      items: s.items.map((item) => ({ ...item, selected: true })),
    })),

  deselectAllItems: () =>
    set((s) => ({
      items: s.items.map((item) => ({ ...item, selected: false })),
    })),
}));
