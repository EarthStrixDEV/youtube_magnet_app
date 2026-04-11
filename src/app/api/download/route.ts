import { NextRequest } from "next/server";
import { spawnDownload, parseProgress, isPostProcessing, parseDestination } from "@/lib/ytdlp";
import { getTempDownloadDir, createToken, isServerMode } from "@/lib/download-tokens";
import type { Format, Quality } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");
  const format = searchParams.get("format") as Format;
  const quality = searchParams.get("quality") as Quality;
  const outputDir = searchParams.get("outputDir");

  // In server mode, always use temp dir; in local mode, require outputDir
  const resolvedOutputDir = isServerMode()
    ? getTempDownloadDir()
    : outputDir;

  if (!url || !format || !quality || !resolvedOutputDir) {
    return new Response(
      JSON.stringify({ error: "Missing required params: url, format, quality, outputDir" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  let processKilled = false;

  const stream = new ReadableStream({
    start(controller) {
      const proc = spawnDownload(url, format, quality, resolvedOutputDir);
      let lastOutputPath = "";
      let stderrBuffer = "";

      // Track multi-fragment downloads (video + audio → merge)
      // yt-dlp downloads each stream separately, each reporting its own 0-100%.
      // We map them into a single overall percentage:
      //   Fragment 1 (video):  0% – 70%
      //   Fragment 2 (audio): 70% – 95%
      //   Post-processing:     95% – 99%
      let fragmentIndex = 0;
      const isMultiStream = format === "MP4" || format === "MOV";
      const FRAG_WEIGHTS = [0.70, 0.25]; // video 70%, audio 25%, remaining 5% for merge

      function overallPercent(rawPercent: number): number {
        if (!isMultiStream) return rawPercent;
        const fi = Math.min(fragmentIndex, FRAG_WEIGHTS.length - 1);
        const base = FRAG_WEIGHTS.slice(0, fi).reduce((a, b) => a + b, 0);
        const weight = FRAG_WEIGHTS[fi];
        return Math.round((base + weight * (rawPercent / 100)) * 100);
      }

      function sendEvent(event: string, data: Record<string, unknown>) {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      }

      function processLine(line: string) {
        // Detect new fragment when yt-dlp starts downloading a new stream
        const dest = parseDestination(line);
        if (dest) {
          // [Merger] output is the final path, not a new fragment
          if (!line.includes("[Merger]")) {
            if (fragmentIndex > 0 || lastOutputPath) {
              fragmentIndex++;
            }
          }
          lastOutputPath = dest;
        }

        // Check for progress
        const progress = parseProgress(line);
        if (progress) {
          sendEvent("progress", {
            percent: overallPercent(progress.percent),
            speed: progress.speed,
            eta: progress.eta,
            totalSize: progress.totalSize,
          });
          return;
        }

        // Check for post-processing
        if (isPostProcessing(line)) {
          sendEvent("progress", {
            percent: isMultiStream ? 97 : 99,
            speed: "",
            eta: "Processing...",
          });
        }
      }

      // Parse stdout line by line
      let stdoutBuf = "";
      proc.stdout?.on("data", (chunk: Buffer) => {
        stdoutBuf += chunk.toString();
        const lines = stdoutBuf.split("\n");
        stdoutBuf = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) processLine(line);
        }
      });

      // Capture stderr for error reporting
      proc.stderr?.on("data", (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
        // Also check stderr for progress (yt-dlp sometimes writes there)
        const lines = stderrBuffer.split("\n");
        stderrBuffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) processLine(line);
        }
      });

      proc.on("close", (code) => {
        if (processKilled) return;

        if (code === 0) {
          // In server mode, create a download token for the file
          const token = isServerMode() && lastOutputPath
            ? createToken(lastOutputPath)
            : undefined;
          sendEvent("complete", {
            outputPath: lastOutputPath,
            ...(token && { downloadToken: token }),
          });
        } else {
          sendEvent("error", {
            message: stderrBuffer.trim().slice(-500) || `yt-dlp exited with code ${code}`,
          });
        }

        try {
          controller.close();
        } catch {
          // Already closed
        }
      });

      proc.on("error", (err) => {
        sendEvent("error", { message: err.message });
        try {
          controller.close();
        } catch {}
      });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        processKilled = true;
        proc.kill("SIGTERM");
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
