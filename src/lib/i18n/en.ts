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
  "queueItem.saveFile": "Save file",
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

  // Settings
  "settings.heading": "00 — Download Settings",
  "settings.saveTo": "Save to:",
  "settings.placeholder": "D:\\Downloads\\YouTube",
  "settings.browse": "Browse",
  "settings.browseTooltip": "Browse for folder",
  "settings.saving": "...",
  "settings.saved": "Saved",
  "settings.set": "Set",
  "settings.setDirWarning": "Please set a download directory before downloading.",

  // Navbar
  "nav.activeWorkers": "Active Workers: ",
  "nav.version": "v1.0",

  // Footer
  "footer.text": "YouTube Magnet v1.0",

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

  // Tool Status Banner
  "tools.missing": "Missing Tools",
  "tools.ytdlpMissing": "yt-dlp is not installed. Run: ",
  "tools.ytdlpCmd": "pip install yt-dlp",
  "tools.ffmpegMissing": "ffmpeg is not installed. Run: ",
  "tools.ffmpegCmd": "winget install Gyan.FFmpeg",

  // User Guide
  "guide.howToUse": "How to use",
  "guide.local.step1Title": "Paste your links",
  "guide.local.step1Desc": "Drop one or multiple YouTube URLs into the text box — one per line, or separated by commas or spaces. You can batch as many links as you want.",
  "guide.local.step2Title": "Pick format & quality",
  "guide.local.step2Desc": "Choose MP4, MOV, MP3, or WAV per item — or set a global default. Each item in the queue can have its own format and quality.",
  "guide.local.step3Title": "Set download folder",
  "guide.local.step3Desc": "Click \"Browse\" to choose where files are saved, or type a path manually.",
  "guide.local.step4Title": "Download all at once",
  "guide.local.step4Desc": "Hit \"Download All\" to start batch downloading with parallel workers. Adjust the worker count (1–8) to control how many files download simultaneously.",
  "guide.server.step3Title": "Download all at once",
  "guide.server.step3Desc": "Hit \"Download All\" to start batch downloading with parallel workers. Adjust the worker count (1–8) to control how many files download simultaneously.",
  "guide.server.step4Title": "Save your files",
  "guide.server.step4Desc": "Once a download is complete, click the save button to download the file to your device. Your download manager (e.g. IDM) will pick it up automatically.",

  // Download errors
  "download.setDirFirst": "Please set a download directory first",

  // Placeholders
  "placeholder.loading": "Loading...",
  "placeholder.duration": "--:--",
  "placeholder.fileSize": "...",

  // Status
  "status.processing": "processing",
};
