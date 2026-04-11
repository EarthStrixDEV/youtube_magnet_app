import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { resolveToken, isServerMode } from "@/lib/download-tokens";

const SETTINGS_PATH = path.join(process.cwd(), ".ytmagnet-settings.json");

function getDownloadDir(): string {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw).downloadDir || "";
  } catch {
    return "";
  }
}

// Map extension to MIME type for proper IDM detection
function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webm": "video/webm",
    ".m4a": "audio/mp4",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const filePath = request.nextUrl.searchParams.get("path");

  let resolvedPath: string;

  if (token) {
    // Token-based download (server mode)
    const entry = resolveToken(token);
    if (!entry) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired download token" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    resolvedPath = entry.filePath;
  } else if (filePath && !isServerMode()) {
    // Path-based download (local mode only)
    const downloadDir = getDownloadDir();
    const normalizedFile = path.resolve(filePath);
    const normalizedDir = path.resolve(downloadDir);

    if (!downloadDir || !normalizedFile.startsWith(normalizedDir)) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    resolvedPath = normalizedFile;
  } else {
    return new Response(
      JSON.stringify({ error: "Missing token or path param" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!fs.existsSync(resolvedPath)) {
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stat = fs.statSync(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const ext = path.extname(resolvedPath);
  const mimeType = getMimeType(ext);
  const fileStream = fs.createReadStream(resolvedPath);

  const stream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk: string | Buffer) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(buf));
      });
      fileStream.on("end", () => {
        controller.close();
      });
      fileStream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      "Content-Length": stat.size.toString(),
      "Accept-Ranges": "bytes",
    },
  });
}
