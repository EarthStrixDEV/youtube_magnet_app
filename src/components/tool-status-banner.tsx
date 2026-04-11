"use client";

import { useState, useEffect } from "react";
import { useQueueStore } from "@/stores/queue-store";
import { useT } from "@/hooks/use-t";

interface HealthStatus {
  ytdlp: boolean;
  ffmpeg: boolean;
  ytdlpVersion?: string;
  ffmpegVersion?: string;
  deploymentMode?: "local" | "server";
}

export function ToolStatusBanner() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const setDeploymentMode = useQueueStore((s) => s.setDeploymentMode);
  const t = useT();

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        setHealth(data);
        if (data.deploymentMode) {
          setDeploymentMode(data.deploymentMode);
        }
        setLoading(false);
      })
      .catch(() => {
        setHealth({ ytdlp: false, ffmpeg: false });
        setLoading(false);
      });
  }, [setDeploymentMode]);

  if (loading || !health) return null;

  // In server mode, tools are managed by the server — don't show banner
  if (health.deploymentMode === "server") return null;

  if (health.ytdlp && health.ffmpeg) return null;

  return (
    <div className="mb-6 p-4 border border-state-danger rounded-sm bg-state-danger-bg">
      <p className="font-mono text-[11px] text-state-danger font-semibold uppercase tracking-wider mb-2">
        {t("tools.missing")}
      </p>
      <div className="font-mono text-[11px] text-ink-soft space-y-1">
        {!health.ytdlp && (
          <p>
            {t("tools.ytdlpMissing")}
            <code className="bg-background-warm px-1.5 py-0.5 rounded-sm">
              {t("tools.ytdlpCmd")}
            </code>
          </p>
        )}
        {!health.ffmpeg && (
          <p>
            {t("tools.ffmpegMissing")}
            <code className="bg-background-warm px-1.5 py-0.5 rounded-sm">
              {t("tools.ffmpegCmd")}
            </code>
          </p>
        )}
      </div>
      {health.ytdlp && (
        <p className="font-mono text-[10px] text-ink-faint mt-2">
          yt-dlp {health.ytdlpVersion}
        </p>
      )}
    </div>
  );
}
