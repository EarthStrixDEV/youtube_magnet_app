import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), ".ytmagnet-settings.json");

interface Settings {
  downloadDir: string;
}

function readSettings(): Settings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { downloadDir: "" };
  }
}

function writeSettings(settings: Settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const downloadDir = body.downloadDir as string;

  if (!downloadDir) {
    return NextResponse.json({ error: "Missing downloadDir" }, { status: 400 });
  }

  // Validate directory exists
  try {
    const stat = fs.statSync(downloadDir);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
    }
  } catch {
    // Try to create it
    try {
      fs.mkdirSync(downloadDir, { recursive: true });
    } catch {
      return NextResponse.json({ error: "Directory does not exist and cannot be created" }, { status: 400 });
    }
  }

  const settings = readSettings();
  settings.downloadDir = downloadDir;
  writeSettings(settings);

  return NextResponse.json({ ok: true });
}
