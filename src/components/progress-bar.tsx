import type { ItemStatus } from "@/lib/types";

interface ProgressBarProps {
  progress: number;
  status: ItemStatus;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  if (status === "queued") return null;

  const barColor = status === "error" ? "bg-state-danger" : "bg-accent";

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-line overflow-hidden">
      <div
        className={`h-full ${barColor} transition-[width] duration-200 ease-linear`}
        style={{ width: status === "error" ? "100%" : `${progress}%` }}
      />
    </div>
  );
}
