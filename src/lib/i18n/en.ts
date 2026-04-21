import type { Translations } from "./types";

export const en: Translations = {
  // Hero
  "hero.title1": "Drop links,",
  "hero.title2": "pull everything.",
  "hero.desc": "Paste YouTube URLs, configure quality, and download them all at once with parallel workers.",

  // Link Input
  "linkInput.heading": "01 — Drop Your Links",
  "linkInput.placeholder": "Paste YouTube URLs here — one per line, or separated by commas or spaces...",
  "linkInput.enter": "Enter",
  "linkInput.addToQueue": "Add to queue",
  "linkInput.shiftEnter": "Shift+Enter",
  "linkInput.newLine": "New line",
  "linkInput.addButton": "Add to Queue",

  // Global Defaults
  "defaults.format": "Default Format",
  "defaults.quality": "Default Quality",

  // Queue
  "queue.heading": "02 — Download Queue",
  "queue.empty": "No items in queue yet. Paste some YouTube URLs above to get started.",
  "queue.total": "Total",
  "queue.active": "Active",
  "queue.done": "Done",
  "queue.clearAll": "Clear Queue",
  "queue.selectAll": "Select All",
  "queue.deselectAll": "Deselect All",
  "queue.startSelected": "Start Selected ({count})",

  // Queue Item
  "queueItem.startDownload": "Start download",
  "queueItem.retryDownload": "Retry download",
  "queueItem.retry": "Retry",
  "queueItem.removeFromQueue": "Remove from queue",
  "queueItem.selectCheckbox": "Select this item",

  // Action Bar
  "action.items": "items",
  "action.total": "total",
  "action.parallel": "Parallel",
  "action.decreaseWorkers": "Decrease workers",
  "action.increaseWorkers": "Increase workers",
  "action.downloading": "Downloading...",
  "action.downloadAll": "Download All",

  // Navbar
  "nav.activeWorkers": "Active Workers: ",
  "nav.version": "v3.0",

  // Footer
  "footer.text": "YouTube Magnet v3.0",

  // Theme Toggle
  "theme.toggle": "Toggle theme",
  "theme.switchLight": "Switch to light theme",
  "theme.switchDark": "Switch to dark theme",

  // Toast
  "toast.dismiss": "Dismiss",
  "toast.downloadComplete": "Download Complete",
  "toast.downloadSuccess": "File downloaded successfully",
  "toast.downloadFailed": "Download Failed",
  "toast.downloadError": "An error occurred",

  // User Guide
  "guide.howToUse": "How to use",
  "guide.step1Title": "Paste your links",
  "guide.step1Desc": "Drop one or multiple YouTube URLs into the text box — one per line, or separated by commas or spaces. You can batch as many links as you want.",
  "guide.step2Title": "Pick format & quality",
  "guide.step2Desc": "Choose MP4, MOV, MP3, or WAV per item — or set a global default. Each item in the queue can have its own format and quality.",
  "guide.step3Title": "Download all at once",
  "guide.step3Desc": "Hit \"Download All\" to start batch downloading with parallel workers. Adjust the worker count (1–8) to control how many files download simultaneously. Files save directly to your browser's download folder.",

  // Placeholders
  "placeholder.loading": "Loading...",
  "placeholder.duration": "--:--",
  "placeholder.fileSize": "...",

  // Processing (ffmpeg.wasm client-side pipeline)
  "status.processing": "processing",
  "status.preparingEncoder": "Preparing encoder...",
  "status.merging": "Merging video + audio...",
  "status.transcodingMp3": "Transcoding to MP3...",
  "status.transcodingWav": "Transcoding to WAV...",
};
