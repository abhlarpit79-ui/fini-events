"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfessionalStatus, setProfessionalBadge, getCredentialsLink } from "@/app/actions/admin";
import { Badge } from "@/components/Badge";
import { waLink } from "@/lib/utils";
import type { Professional } from "@/lib/types";

export function ProfessionalAdminRow({ p, email }: { p: Professional & { city: { name: string } | null }; email: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(p.admin_note ?? "");
  const [open, setOpen] = useState(p.status === "pending");
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div className="card p-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div className="min-w-0">
          <div className="font-semibold flex items-center gap-2 flex-wrap">
            {p.display_name} <Badge badge={p.badge} />
            <span className={`badge ${p.status === "approved" ? "bg-green-100 text-green-800" : p.status === "pending" ? "bg-yellow-100 text-yellow-900" : "bg-red-100 text-red-800"}`}>{p.status}</span>
          </div>
          <div className="text-sm text-muted">{p.category} · {p.city?.name ?? "—"}{p.area ? ` · ${p.area}` : ""}</div>
          <div className="text-xs text-muted">{email} · {p.whatsapp && <a className="underline" href={waLink(p.whatsapp)} target="_blank" rel="noreferrer">WhatsApp {p.whatsapp}</a>}</div>
        </div>
        <button className="text-xs underline text-muted" onClick={() => setOpen(!open)}>{open ? "Hide" : "Review"}</button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-border pt-2">
          {p.bio && <p className="text-sm whitespace-pre-line">{p.bio}</p>}
          <div className="text-xs text-muted flex gap-3 flex-wrap">
            {p.website && <a className="underline" href={p.website} target="_blank" rel="noreferrer">Website</a>}
            {p.instagram && <span>IG: {p.instagram}</span>}
            {p.credentials_url ? (
              <button className="underline text-brand" onClick={async () => { const r = await getCredentialsLink(p.credentials_url!); if (r.url) window.open(r.url, "_blank"); }}>
                View credentials
              </button>
            ) : <span className="text-red-700">No credentials uploaded</span>}
          </div>
          <input className="input !py-1.5 text-sm" placeholder="Note to professional (shown if rejected)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {p.status !== "approved" && <button disabled={pending} className="btn-primary !py-1.5" onClick={() => run(() => setProfessionalStatus(p.id, "approved", note))}>Approve ✔</button>}
            {p.status !== "rejected" && <button disabled={pending} className="btn-secondary !py-1.5 text-red-700" onClick={() => run(() => setProfessionalStatus(p.id, "rejected", note))}>Reject</button>}
            {p.status === "approved" && (
              <select className="input !w-auto !py-1.5 text-sm" value={p.badge ?? ""} disabled={pending} onChange={(e) => run(() => setProfessionalBadge(p.id, (e.target.value || null) as never))}>
                <option value="">No badge</option>
                <option value="verified">Verified</option>
                <option value="expert">Expert</option>
                <option value="parent_favourite">Parent favourite</option>
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
