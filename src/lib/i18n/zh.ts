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

  // Queue Item
  "queueItem.startDownload": "开始下载",
  "queueItem.retryDownload": "重试下载",
  "queueItem.retry": "重试",
  "queueItem.saveFile": "保存文件",
  "queueItem.removeFromQueue": "从队列中移除",

  // Action Bar
  "action.items": "个项目",
  "action.total": "总计",
  "action.parallel": "并行",
  "action.decreaseWorkers": "减少下载线程",
  "action.increaseWorkers": "增加下载线程",
  "action.downloading": "下载中...",
  "action.downloadAll": "全部下载",

  // Settings
  "settings.heading": "00 — 下载设置",
  "settings.saveTo": "保存至：",
  "settings.placeholder": "D:\\Downloads\\YouTube",
  "settings.browse": "浏览",
  "settings.browseTooltip": "选择文件夹",
  "settings.saving": "...",
  "settings.saved": "已保存",
  "settings.set": "设置",
  "settings.setDirWarning": "请先设置下载目录再开始下载。",

  // Navbar
  "nav.activeWorkers": "下载线程：",
  "nav.version": "v1.0",

  // Footer
  "footer.text": "YouTube Magnet v1.0",

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

  // Tool Status Banner
  "tools.missing": "缺少工具",
  "tools.ytdlpMissing": "未安装 yt-dlp。请运行：",
  "tools.ytdlpCmd": "pip install yt-dlp",
  "tools.ffmpegMissing": "未安装 ffmpeg。请运行：",
  "tools.ffmpegCmd": "winget install Gyan.FFmpeg",

  // User Guide
  "guide.howToUse": "使用方法",
  "guide.local.step1Title": "粘贴链接",
  "guide.local.step1Desc": "将一个或多个 YouTube 链接粘贴到文本框中 — 每行一个，或用逗号、空格分隔。可以批量添加任意数量的链接。",
  "guide.local.step2Title": "选择格式和画质",
  "guide.local.step2Desc": "为每个项目选择 MP4、MOV、MP3 或 WAV — 或设置全局默认值。队列中的每个项目可以有自己的格式和画质。",
  "guide.local.step3Title": "设置下载文件夹",
  "guide.local.step3Desc": "点击「浏览」选择保存文件的位置，或手动输入路径。",
  "guide.local.step4Title": "一键全部下载",
  "guide.local.step4Desc": "点击「全部下载」开始批量下载。调整下载线程数（1-8）来控制同时下载的文件数量。",
  "guide.server.step3Title": "一键全部下载",
  "guide.server.step3Desc": "点击「全部下载」开始批量下载。调整下载线程数（1-8）来控制同时下载的文件数量。",
  "guide.server.step4Title": "保存文件",
  "guide.server.step4Desc": "下载完成后，点击保存按钮将文件下载到您的设备。下载管理器（如 IDM）会自动接管下载。",

  // Download errors
  "download.setDirFirst": "请先设置下载目录",

  // Placeholders
  "placeholder.loading": "加载中...",
  "placeholder.duration": "--:--",
  "placeholder.fileSize": "...",
};
