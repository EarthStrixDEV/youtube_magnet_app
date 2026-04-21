import { NextRequest } from "next/server";
import { spawnDownload, parseProgress, isPostProcessing, parseDestination, buildYtdlpArgs, getYtdlpPath } from "@/lib/ytdlp";
import { getTempDownloadDir, createToken } from "@/lib/download-tokens";
import { isServerMode } from "@/lib/deployment-mode";
import { execFile } from "child_process";
import type { Format, Quality } from "@/lib/types";

function getYtdlpVersion(): Promise<string> {
  const ytdlpPath = getYtdlpPath();
  if (!ytdlpPath) return Promise.resolve("unknown");
  return new Promise((resolve) => {
    execFile(ytdlpPath, ["--version"], (err, stdout) => {
      resolve(err ? "unknown" : stdout.trim());
    });
  });
}

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
      const ytdlpArgs = buildYtdlpArgs(url, format, quality, resolvedOutputDir);
      let lastOutputPath = "";
      // Full stderr accumulator — never truncated (bot errors often appear in first lines)
      let stderrFull = "";
      // Stdout line buffer for progress parsing (keep last 200 lines for error context)
      const stdoutLines: string[] = [];

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

      // Parse stdout line by line; keep last 200 lines for error context
      let stdoutBuf = "";
      proc.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutBuf += text;
        const lines = stdoutBuf.split("\n");
        stdoutBuf = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            stdoutLines.push(trimmed);
            if (stdoutLines.length > 200) stdoutLines.shift();
            processLine(trimmed);
          }
        }
      });

      // Capture FULL stderr — never consume lines from this buffer to avoid missing bot errors
      let stderrLineBuf = "";
      proc.stderr?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stderrFull += text;
        // Also parse stderr lines for progress (yt-dlp sometimes writes progress there)
        stderrLineBuf += text;
        const lines = stderrLineBuf.split("\n");
        stderrLineBuf = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) processLine(line);
        }
      });

      proc.on("close", async (code) => {
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
          // Extract the first actionable ERROR line for the client
          const firstErrorLine = stderrFull
            .split("\n")
            .find((l) => l.includes("ERROR:") || l.includes("Sign in") || l.includes("bot"))
            ?.trim();
          const clientMessage =
            firstErrorLine ||
            stderrFull.trim().slice(0, 300) ||
            `yt-dlp exited with code ${code}`;

          // Full structured log for Render/server console
          const ytdlpVersion = await getYtdlpVersion();
          console.error("[ytdlp] download failed", {
            exitCode: code,
            ytdlpVersion,
            url,
            format,
            quality,
            args: ytdlpArgs,
            stderr: stderrFull.trim(),
            stdoutTail: stdoutLines.slice(-200).join("\n"),
          });

          sendEvent("error", { message: clientMessage });
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
