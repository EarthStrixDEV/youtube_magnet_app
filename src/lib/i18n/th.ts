import type { Translations } from "./types";

export const th: Translations = {
  // Hero
  "hero.title1": "วางลิงก์,",
  "hero.title2": "ดาวน์โหลดทั้งหมด.",
  "hero.desc": "วาง URL ของ YouTube กำหนดคุณภาพ แล้วดาวน์โหลดทั้งหมดพร้อมกันด้วยระบบดาวน์โหลดแบบขนาน",

  // Link Input
  "linkInput.heading": "01 — วางลิงก์ของคุณ",
  "linkInput.placeholder": "วาง URL ของ YouTube ที่นี่ — บรรทัดละหนึ่ง หรือคั่นด้วยเครื่องหมายจุลภาคหรือเว้นวรรค...",
  "linkInput.enter": "Enter",
  "linkInput.addToQueue": "เพิ่มเข้าคิว",
  "linkInput.shiftEnter": "Shift+Enter",
  "linkInput.newLine": "บรรทัดใหม่",
  "linkInput.addButton": "เพิ่มเข้าคิว",

  // Global Defaults
  "defaults.format": "รูปแบบเริ่มต้น",
  "defaults.quality": "คุณภาพเริ่มต้น",

  // Queue
  "queue.heading": "02 — คิวดาวน์โหลด",
  "queue.empty": "ยังไม่มีรายการในคิว วาง URL ของ YouTube ด้านบนเพื่อเริ่มต้น",
  "queue.total": "ทั้งหมด",
  "queue.active": "กำลังทำ",
  "queue.done": "เสร็จ",
  "queue.clearAll": "ล้างคิว",
  "queue.selectAll": "เลือกทั้งหมด",
  "queue.deselectAll": "ยกเลิกทั้งหมด",
  "queue.startSelected": "เริ่มรายการที่เลือก ({count})",

  // Queue Item
  "queueItem.startDownload": "เริ่มดาวน์โหลด",
  "queueItem.retryDownload": "ลองดาวน์โหลดอีกครั้ง",
  "queueItem.retry": "ลองใหม่",
  "queueItem.saveFile": "บันทึกไฟล์",
  "queueItem.removeFromQueue": "ลบออกจากคิว",
  "queueItem.selectCheckbox": "เลือกรายการนี้",

  // Action Bar
  "action.items": "รายการ",
  "action.total": "รวม",
  "action.parallel": "ขนาน",
  "action.decreaseWorkers": "ลดตัวดาวน์โหลด",
  "action.increaseWorkers": "เพิ่มตัวดาวน์โหลด",
  "action.downloading": "กำลังดาวน์โหลด...",
  "action.downloadAll": "ดาวน์โหลดทั้งหมด",

  // Settings
  "settings.heading": "00 — ตั้งค่าดาวน์โหลด",
  "settings.saveTo": "บันทึกที่:",
  "settings.placeholder": "D:\\Downloads\\YouTube",
  "settings.browse": "เรียกดู",
  "settings.browseTooltip": "เลือกโฟลเดอร์",
  "settings.saving": "...",
  "settings.saved": "บันทึกแล้ว",
  "settings.set": "ตั้งค่า",
  "settings.setDirWarning": "กรุณาตั้งค่าโฟลเดอร์ดาวน์โหลดก่อนเริ่ม",

  // Navbar
  "nav.activeWorkers": "ตัวดาวน์โหลด: ",
  "nav.version": "v1.0",

  // Footer
  "footer.text": "YouTube Magnet v1.0",

  // Theme Toggle
  "theme.toggle": "สลับธีม",
  "theme.switchLight": "เปลี่ยนเป็นธีมสว่าง",
  "theme.switchDark": "เปลี่ยนเป็นธีมมืด",

  // Toast
  "toast.dismiss": "ปิด",
  "toast.downloadComplete": "ดาวน์โหลดเสร็จ",
  "toast.downloadSuccess": "ดาวน์โหลดไฟล์สำเร็จ",
  "toast.downloadFailed": "ดาวน์โหลดล้มเหลว",
  "toast.downloadError": "เกิดข้อผิดพลาด",

  // Tool Status Banner
  "tools.missing": "ไม่พบเครื่องมือ",
  "tools.ytdlpMissing": "ยังไม่ได้ติดตั้ง yt-dlp รันคำสั่ง: ",
  "tools.ytdlpCmd": "pip install yt-dlp",
  "tools.ffmpegMissing": "ยังไม่ได้ติดตั้ง ffmpeg รันคำสั่ง: ",
  "tools.ffmpegCmd": "winget install Gyan.FFmpeg",

  // User Guide
  "guide.howToUse": "วิธีใช้",
  "guide.local.step1Title": "วางลิงก์ของคุณ",
  "guide.local.step1Desc": "วาง URL ของ YouTube หนึ่งหรือหลายรายการลงในช่องข้อความ — บรรทัดละหนึ่ง หรือคั่นด้วยเครื่องหมายจุลภาคหรือเว้นวรรค",
  "guide.local.step2Title": "เลือกรูปแบบและคุณภาพ",
  "guide.local.step2Desc": "เลือก MP4, MOV, MP3 หรือ WAV ต่อรายการ — หรือตั้งค่าเริ่มต้นรวม แต่ละรายการในคิวสามารถมีรูปแบบและคุณภาพเป็นของตัวเอง",
  "guide.local.step3Title": "ตั้งค่าโฟลเดอร์ดาวน์โหลด",
  "guide.local.step3Desc": "คลิก \"เรียกดู\" เพื่อเลือกที่บันทึกไฟล์ หรือพิมพ์เส้นทางด้วยตนเอง",
  "guide.local.step4Title": "ดาวน์โหลดทั้งหมดพร้อมกัน",
  "guide.local.step4Desc": "กด \"ดาวน์โหลดทั้งหมด\" เพื่อเริ่มดาวน์โหลดแบบกลุ่มพร้อมตัวดาวน์โหลดขนาน ปรับจำนวน (1–8) เพื่อควบคุมจำนวนไฟล์ที่ดาวน์โหลดพร้อมกัน",
  "guide.server.step3Title": "ดาวน์โหลดทั้งหมดพร้อมกัน",
  "guide.server.step3Desc": "กด \"ดาวน์โหลดทั้งหมด\" เพื่อเริ่มดาวน์โหลดแบบกลุ่มพร้อมตัวดาวน์โหลดขนาน ปรับจำนวน (1–8) เพื่อควบคุมจำนวนไฟล์ที่ดาวน์โหลดพร้อมกัน",
  "guide.server.step4Title": "บันทึกไฟล์ของคุณ",
  "guide.server.step4Desc": "เมื่อดาวน์โหลดเสร็จแล้ว คลิกปุ่มบันทึกเพื่อดาวน์โหลดไฟล์ลงอุปกรณ์ของคุณ ตัวจัดการดาวน์โหลด (เช่น IDM) จะรับไฟล์โดยอัตโนมัติ",

  // Download errors
  "download.setDirFirst": "กรุณาตั้งค่าโฟลเดอร์ดาวน์โหลดก่อน",

  // Placeholders
  "placeholder.loading": "กำลังโหลด...",
  "placeholder.duration": "--:--",
  "placeholder.fileSize": "...",

  // Status
  "status.processing": "กำลังประมวลผล",
};
