"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueueStore } from "@/stores/queue-store";
import { useT } from "@/hooks/use-t";

export function SettingsPanel() {
  const downloadDir = useQueueStore((s) => s.downloadDir);
  const setDownloadDir = useQueueStore((s) => s.setDownloadDir);
  const deploymentMode = useQueueStore((s) => s.deploymentMode);
  const [inputValue, setInputValue] = useState(downloadDir);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const t = useT();

  // Load settings on mount (local mode only)
  useEffect(() => {
    if (deploymentMode === "server") return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.downloadDir) {
          setDownloadDir(data.downloadDir);
          setInputValue(data.downloadDir);
        }
      })
      .catch(() => {});
  }, [setDownloadDir, deploymentMode]);

  const saveDir = useCallback(async (dirPath?: string) => {
    const dir = (dirPath ?? inputValue).trim();
    if (!dir) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadDir: dir }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setDownloadDir(dir);
      setInputValue(dir);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to save");
    }
  }, [inputValue, setDownloadDir]);

  const browseFolder = useCallback(async () => {
    try {
      const res = await fetch("/api/browse-folder");
      const data = await res.json();
      if (data.cancelled || !data.path) return;
      setInputValue(data.path);
      await saveDir(data.path);
    } catch {
      setStatus("error");
      setErrorMsg("Failed to open folder picker");
    }
  }, [saveDir]);

  // In server mode, downloads are managed server-side — no folder settings needed
  if (deploymentMode === "server") return null;

  return (
    <div className="animate-rise">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint mb-4 font-medium">
        {t("settings.heading")}
      </h2>
      <div className="bg-card border border-line rounded-sm p-4 shadow-[var(--shadow-small)] theme-transition">
        <div className="flex items-center gap-3">
          <label className="font-mono text-[11px] text-ink-faint whitespace-nowrap">
            {t("settings.saveTo")}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setStatus("idle");
            }}
            onBlur={() => saveDir()}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveDir();
            }}
            placeholder={t("settings.placeholder")}
            className="flex-1 bg-transparent border-b border-line text-ink font-mono text-sm px-1 py-1 outline-none focus:border-accent transition-colors placeholder:text-ink-faint"
            spellCheck={false}
          />
          <button
            onClick={browseFolder}
            className="font-mono text-[11px] px-3 py-1.5 rounded-sm border border-line text-ink-faint hover:text-accent hover:border-accent transition-all cursor-pointer"
            title={t("settings.browseTooltip")}
          >
            {t("settings.browse")}
          </button>
          <button
            onClick={() => saveDir()}
            className="font-mono text-[11px] px-3 py-1.5 rounded-sm border border-line text-ink-faint hover:text-accent hover:border-accent transition-all cursor-pointer"
          >
            {status === "saving" ? t("settings.saving") : status === "saved" ? t("settings.saved") : t("settings.set")}
          </button>
        </div>
        {status === "error" && (
          <p className="font-mono text-[10px] text-state-danger mt-2">{errorMsg}</p>
        )}
        {!downloadDir && status === "idle" && (
          <p className="font-mono text-[10px] text-accent mt-2">
            {t("settings.setDirWarning")}
          </p>
        )}
      </div>
    </div>
  );
}
