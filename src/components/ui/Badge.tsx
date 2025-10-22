// src/components/ui/Badge.tsx
export function levelFromPoints(points: number) {
  if (points >= 150) return { level: "Platina", color: "#a1a1aa" };
  if (points >= 100) return { level: "Ouro", color: "#facc15" };
  if (points >= 50) return { level: "Prata", color: "#cbd5e1" };
  return { level: "Bronze", color: "#f59e0b" };
}

export default function BadgeLevel({ points }: { points: number }) {
  const { level, color } = levelFromPoints(points);
  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-sm font-medium"
      style={{ borderColor: "rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)" }}
      aria-label={`Nível ${level}`}
      title={`Nível ${level} (${points} pts)`}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {level}
    </span>
  );
}
