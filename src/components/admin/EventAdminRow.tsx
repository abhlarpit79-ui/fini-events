"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setEventStatusAdmin, setEventFeatured } from "@/app/actions/admin";
import { fmtDateTime, fmtFee } from "@/lib/utils";
import { ageBandLabel, categoryMeta } from "@/lib/constants";
import type { Event } from "@/lib/types";

type Row = Event & { professional: { display_name: string; status: string; badge: string | null }; city: { name: string } };

export function EventAdminRow({ e, registered }: { e: Row; registered: number }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(e.admin_note ?? "");
  const [open, setOpen] = useState(e.status === "pending");
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  const cat = categoryMeta(e.category);

  return (
    <div className="card p-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div className="min-w-0">
          <div className="font-semibold flex items-center gap-2 flex-wrap">
            {e.is_featured && <span className="badge bg-yellow-300 text-yellow-900">★</span>}
            <Link href={`/events/${e.id}`} className="hover:underline">{e.title}</Link>
            <span className={`badge ${e.status === "published" ? "bg-green-100 text-green-800" : e.status === "pending" ? "bg-yellow-100 text-yellow-900" : "bg-gray-100 text-gray-700"}`}>{e.status}</span>
          </div>
          <div className="text-sm text-muted">
            {fmtDateTime(e.starts_at)} · {cat.emoji} {cat.label} · {e.city?.name}{e.area ? ` · ${e.area}` : ""} · {fmtFee(e.fee)} · {registered} registered{e.capacity ? `/${e.capacity}` : ""}
          </div>
          <div className="text-xs text-muted">
            by {e.professional.display_name} {e.professional.status !== "approved" && <span className="text-red-700">(professional {e.professional.status})</span>} · {e.age_bands.map(ageBandLabel).join(", ")}
          </div>
        </div>
        <button className="text-xs underline text-muted" onClick={() => setOpen(!open)}>{open ? "Hide" : "Review"}</button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-border pt-2">
          <p className="text-sm whitespace-pre-line line-clamp-6">{e.description}</p>
          <input className="input !py-1.5 text-sm" placeholder="Note to professional (shown when not published)" value={note} onChange={(ev) => setNote(ev.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {e.status !== "published" && <button disabled={pending} className="btn-primary !py-1.5" onClick={() => run(() => setEventStatusAdmin(e.id, "published", note))}>Publish ✔</button>}
            {e.status === "published" && <button disabled={pending} className="btn-secondary !py-1.5" onClick={() => run(() => setEventStatusAdmin(e.id, "pending", note))}>Unpublish</button>}
            {e.status !== "cancelled" && <button disabled={pending} className="btn-secondary !py-1.5 text-red-700" onClick={() => run(() => setEventStatusAdmin(e.id, "cancelled", note))}>Cancel</button>}
            <button disabled={pending} className="btn-secondary !py-1.5" onClick={() => run(() => setEventFeatured(e.id, !e.is_featured))}>{e.is_featured ? "Remove featured" : "★ Feature"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
