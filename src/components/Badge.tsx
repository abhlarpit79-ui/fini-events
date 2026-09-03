import type { ProBadge } from "@/lib/types";

const META: Record<NonNullable<ProBadge>, { label: string; cls: string; icon: string }> = {
  verified: { label: "Verified", cls: "bg-green-100 text-green-800", icon: "✔" },
  expert: { label: "Expert", cls: "bg-blue-100 text-blue-800", icon: "★" },
  parent_favourite: { label: "Parent favourite", cls: "bg-purple-100 text-purple-800", icon: "♥" },
};

export function Badge({ badge, compact }: { badge: ProBadge; compact?: boolean }) {
  if (!badge) return null;
  const m = META[badge];
  return (
    <span className={`badge ${m.cls}`} title={m.label}>
      {m.icon}
      {!compact && <span>{m.label}</span>}
    </span>
  );
}
