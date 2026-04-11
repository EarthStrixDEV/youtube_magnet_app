"use client";

import { useToastStore } from "@/stores/toast-store";
import { useT } from "@/hooks/use-t";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const t = useT();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-slide-in border rounded-sm p-4 shadow-[var(--shadow-large)] theme-transition ${
            toast.type === "success"
              ? "bg-card border-accent"
              : "bg-card border-state-danger"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span className="shrink-0 mt-0.5">
              {toast.type === "success" ? (
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-state-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              )}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                {toast.title}
              </p>
              <p className="text-sm text-ink font-medium mt-0.5 truncate" title={toast.message}>
                {toast.message}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-faint hover:text-ink transition-colors cursor-pointer"
              aria-label={t("toast.dismiss")}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
