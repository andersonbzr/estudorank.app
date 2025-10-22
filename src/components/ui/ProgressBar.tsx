// src/components/ui/ProgressBar.tsx
export default function ProgressBar({
  value,
  max = 100,
}: {
  value: number;
  max?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-[color:var(--accent,#A3E635)] transition-all"
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
    </div>
  );
}
