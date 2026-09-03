import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { EventAdminRow } from "@/components/admin/EventAdminRow";
import type { Event } from "@/lib/types";

export default async function AdminEvents({ searchParams }: PageProps<"/admin/events">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const db = createAdminClient();
  let q = db
    .from("events")
    .select("*, professional:professionals(display_name,status,badge), city:cities(name)")
    .order("starts_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const ids = (data ?? []).map((e) => e.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: c } = await db.from("event_counts").select("event_id,registered_count").in("event_id", ids);
    c?.forEach((r) => counts.set(r.event_id, Number(r.registered_count)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Events</h1>
        <div className="flex gap-1">
          {["", "pending", "published", "cancelled", "draft"].map((s) => (
            <Link key={s} href={`/admin/events${s ? `?status=${s}` : ""}`} className={`chip ${status === s ? "chip-active" : ""}`}>{s || "all"}</Link>
          ))}
        </div>
      </div>
      {(data ?? []).length === 0 && <div className="card p-8 text-center text-sm text-muted">Nothing here.</div>}
      {(data ?? []).map((e) => (
        <EventAdminRow
          key={e.id}
          e={e as Event & { professional: { display_name: string; status: string; badge: string | null }; city: { name: string } }}
          registered={counts.get(e.id) ?? 0}
        />
      ))}
    </div>
  );
}
