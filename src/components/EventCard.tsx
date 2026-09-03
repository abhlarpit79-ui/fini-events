import Link from "next/link";
import { ageBandLabel, categoryMeta } from "@/lib/constants";
import { fmtDate, fmtTime, fmtFee } from "@/lib/utils";
import type { EventWithPro } from "@/lib/types";
import { Badge } from "./Badge";

export function EventCard({ e }: { e: EventWithPro }) {
  const cat = categoryMeta(e.category);
  const where = e.mode === "online" ? "Online" : [e.venue_name, e.area].filter(Boolean).join(" · ");
  const full = e.capacity != null && (e.registered_count ?? 0) >= e.capacity;
  return (
    <Link href={`/events/${e.id}`} className="card overflow-hidden flex flex-col hover:shadow-md transition">
      <div className="h-36 bg-orange-100 relative">
        {e.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{cat.emoji}</div>
        )}
        {e.is_featured && (
          <span className="absolute top-2 left-2 badge bg-yellow-300 text-yellow-900">★ Featured</span>
        )}
        {full && (
          <span className="absolute top-2 right-2 badge bg-white/90 text-red-700">Waitlist</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="text-xs text-muted">{cat.emoji} {cat.label}</div>
        <h3 className="font-semibold leading-snug line-clamp-2">{e.title}</h3>
        <div className="text-sm">
          <span className="font-medium">{fmtDate(e.starts_at)}</span>
          <span className="text-muted"> · {fmtTime(e.starts_at)}</span>
        </div>
        {where && <div className="text-sm text-muted line-clamp-1">📍 {where}</div>}
        <div className="flex flex-wrap gap-1 mt-1">
          {e.age_bands.map((b) => (
            <span key={b} className="chip !py-0.5">{ageBandLabel(b)}</span>
          ))}
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between text-sm">
          <span className="text-muted line-clamp-1 flex items-center gap-1">
            {e.professional.display_name} <Badge badge={e.professional.badge} compact />
          </span>
          <span className={`font-semibold ${e.fee > 0 ? "" : "text-accent"}`}>{fmtFee(e.fee)}</span>
        </div>
      </div>
    </Link>
  );
}
