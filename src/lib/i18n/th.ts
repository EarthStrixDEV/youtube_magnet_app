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

  // Navbar
  "nav.activeWorkers": "ตัวดาวน์โหลด: ",
  "nav.version": "v3.0",

  // Footer
  "footer.text": "YouTube Magnet v3.0",

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

  // User Guide
  "guide.howToUse": "วิธีใช้",
  "guide.step1Title": "วางลิงก์ของคุณ",
  "guide.step1Desc": "วาง URL ของ YouTube หนึ่งหรือหลายรายการลงในช่องข้อความ — บรรทัดละหนึ่ง หรือคั่นด้วยเครื่องหมายจุลภาคหรือเว้นวรรค",
  "guide.step2Title": "เลือกรูปแบบและคุณภาพ",
  "guide.step2Desc": "เลือก MP4, MOV, MP3 หรือ WAV ต่อรายการ — หรือตั้งค่าเริ่มต้นรวม แต่ละรายการในคิวสามารถมีรูปแบบและคุณภาพเป็นของตัวเอง",
  "guide.step3Title": "ดาวน์โหลดทั้งหมดพร้อมกัน",
  "guide.step3Desc": "กด \"ดาวน์โหลดทั้งหมด\" เพื่อเริ่มดาวน์โหลดแบบกลุ่มพร้อมตัวดาวน์โหลดขนาน ปรับจำนวน (1–8) ไฟล์จะถูกบันทึกตรงในโฟลเดอร์ดาวน์โหลดของเบราว์เซอร์",

  // Placeholders
  "placeholder.loading": "กำลังโหลด...",
  "placeholder.duration": "--:--",
  "placeholder.fileSize": "...",

  // Processing (ffmpeg.wasm client-side pipeline)
  "status.processing": "กำลังประมวลผล",
  "status.preparingEncoder": "กำลังเตรียมตัวเข้ารหัส...",
  "status.merging": "กำลังรวมวิดีโอ + เสียง...",
  "status.transcodingMp3": "กำลังแปลงเป็น MP3...",
  "status.transcodingWav": "กำลังแปลงเป็น WAV...",
};
