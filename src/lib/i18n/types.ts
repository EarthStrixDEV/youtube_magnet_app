export type Locale = "en" | "th" | "zh";

export type TranslationKey =
  // Hero
  | "hero.title1"
  | "hero.title2"
  | "hero.desc"
  // Link Input
  | "linkInput.heading"
  | "linkInput.placeholder"
  | "linkInput.enter"
  | "linkInput.addToQueue"
  | "linkInput.shiftEnter"
  | "linkInput.newLine"
  | "linkInput.addButton"
  // Global Defaults
  | "defaults.format"
  | "defaults.quality"
  // Queue
  | "queue.heading"
  | "queue.empty"
  | "queue.total"
  | "queue.active"
  | "queue.done"
  // Queue Item
  | "queueItem.startDownload"
  | "queueItem.retryDownload"
  | "queueItem.retry"
  | "queueItem.saveFile"
  | "queueItem.removeFromQueue"
  // Action Bar
  | "action.items"
  | "action.total"
  | "action.parallel"
  | "action.decreaseWorkers"
  | "action.increaseWorkers"
  | "action.downloading"
  | "action.downloadAll"
  // Settings
  | "settings.heading"
  | "settings.saveTo"
  | "settings.placeholder"
  | "settings.browse"
  | "settings.browseTooltip"
  | "settings.saving"
  | "settings.saved"
  | "settings.set"
  | "settings.setDirWarning"
  // Navbar
  | "nav.activeWorkers"
  | "nav.version"
  // Footer
  | "footer.text"
  // Theme Toggle
  | "theme.toggle"
  | "theme.switchLight"
  | "theme.switchDark"
  // Toast
  | "toast.dismiss"
  | "toast.downloadComplete"
  | "toast.downloadSuccess"
  | "toast.downloadFailed"
  | "toast.downloadError"
  // Tool Status Banner
  | "tools.missing"
  | "tools.ytdlpMissing"
  | "tools.ytdlpCmd"
  | "tools.ffmpegMissing"
  | "tools.ffmpegCmd"
  // User Guide
  | "guide.howToUse"
  | "guide.local.step1Title"
  | "guide.local.step1Desc"
  | "guide.local.step2Title"
  | "guide.local.step2Desc"
  | "guide.local.step3Title"
  | "guide.local.step3Desc"
  | "guide.local.step4Title"
  | "guide.local.step4Desc"
  | "guide.server.step3Title"
  | "guide.server.step3Desc"
  | "guide.server.step4Title"
  | "guide.server.step4Desc"
  // Download errors
  | "download.setDirFirst"
  // Placeholders
  | "placeholder.loading"
  | "placeholder.duration"
  | "placeholder.fileSize";

export type Translations = Record<TranslationKey, string>;
