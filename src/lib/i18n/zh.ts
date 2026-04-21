import type { Translations } from "./types";

export const zh: Translations = {
  // Hero
  "hero.title1": "粘贴链接，",
  "hero.title2": "一键下载。",
  "hero.desc": "粘贴 YouTube 链接，设置画质，使用并行下载一次性全部下载。",

  // Link Input
  "linkInput.heading": "01 — 粘贴链接",
  "linkInput.placeholder": "在此粘贴 YouTube 链接 — 每行一个，或用逗号、空格分隔...",
  "linkInput.enter": "Enter",
  "linkInput.addToQueue": "添加到队列",
  "linkInput.shiftEnter": "Shift+Enter",
  "linkInput.newLine": "换行",
  "linkInput.addButton": "添加到队列",

  // Global Defaults
  "defaults.format": "默认格式",
  "defaults.quality": "默认画质",

  // Queue
  "queue.heading": "02 — 下载队列",
  "queue.empty": "队列中还没有项目。在上方粘贴 YouTube 链接即可开始。",
  "queue.total": "总计",
  "queue.active": "进行中",
  "queue.done": "已完成",
  "queue.clearAll": "清空队列",
  "queue.selectAll": "全选",
  "queue.deselectAll": "取消全选",
  "queue.startSelected": "开始所选 ({count})",

  // Queue Item
  "queueItem.startDownload": "开始下载",
  "queueItem.retryDownload": "重试下载",
  "queueItem.retry": "重试",
  "queueItem.removeFromQueue": "从队列中移除",
  "queueItem.selectCheckbox": "选择此项",

  // Action Bar
  "action.items": "个项目",
  "action.total": "总计",
  "action.parallel": "并行",
  "action.decreaseWorkers": "减少下载线程",
  "action.increaseWorkers": "增加下载线程",
  "action.downloading": "下载中...",
  "action.downloadAll": "全部下载",

  // Navbar
  "nav.activeWorkers": "下载线程：",
  "nav.version": "v3.0",

  // Footer
  "footer.text": "YouTube Magnet v3.0",

  // Theme Toggle
  "theme.toggle": "切换主题",
  "theme.switchLight": "切换到浅色主题",
  "theme.switchDark": "切换到深色主题",

  // Toast
  "toast.dismiss": "关闭",
  "toast.downloadComplete": "下载完成",
  "toast.downloadSuccess": "文件下载成功",
  "toast.downloadFailed": "下载失败",
  "toast.downloadError": "发生错误",

  // User Guide
  "guide.howToUse": "使用方法",
  "guide.step1Title": "粘贴链接",
  "guide.step1Desc": "将一个或多个 YouTube 链接粘贴到文本框中 — 每行一个，或用逗号、空格分隔。可以批量添加任意数量的链接。",
  "guide.step2Title": "选择格式和画质",
  "guide.step2Desc": "为每个项目选择 MP4、MOV、MP3 或 WAV — 或设置全局默认值。队列中的每个项目可以有自己的格式和画质。",
  "guide.step3Title": "一键全部下载",
  "guide.step3Desc": "点击「全部下载」开始批量下载。调整下载线程数（1-8）来控制同时下载的文件数量。文件将直接保存到浏览器的下载文件夹。",

  // Placeholders
  "placeholder.loading": "加载中...",
  "placeholder.duration": "--:--",
  "placeholder.fileSize": "...",

  // Processing (ffmpeg.wasm client-side pipeline)
  "status.processing": "处理中",
  "status.preparingEncoder": "正在准备编码器...",
  "status.merging": "正在合并视频 + 音频...",
  "status.transcodingMp3": "正在转码为 MP3...",
  "status.transcodingWav": "正在转码为 WAV...",
};
