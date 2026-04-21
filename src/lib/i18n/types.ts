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
  | "queue.clearAll"
  | "queue.selectAll"
  | "queue.deselectAll"
  | "queue.startSelected"
  // Queue Item
  | "queueItem.startDownload"
  | "queueItem.retryDownload"
  | "queueItem.retry"
  | "queueItem.removeFromQueue"
  | "queueItem.selectCheckbox"
  // Action Bar
  | "action.items"
  | "action.total"
  | "action.parallel"
  | "action.decreaseWorkers"
  | "action.increaseWorkers"
  | "action.downloading"
  | "action.downloadAll"
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
  // User Guide
  | "guide.howToUse"
  | "guide.step1Title"
  | "guide.step1Desc"
  | "guide.step2Title"
  | "guide.step2Desc"
  | "guide.step3Title"
  | "guide.step3Desc"
  // Placeholders
  | "placeholder.loading"
  | "placeholder.duration"
  | "placeholder.fileSize"
  // Processing (ffmpeg.wasm client-side pipeline)
  | "status.processing"
  | "status.preparingEncoder"
  | "status.merging"
  | "status.transcodingMp3"
  | "status.transcodingWav";

export type Translations = Record<TranslationKey, string>;
