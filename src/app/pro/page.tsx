import Link from "next/link";
import { getCities, getMyProfessional, attachCounts } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { ProProfileForm } from "@/components/ProProfileForm";
import { fmtDateTime } from "@/lib/utils";
import { Badge } from "@/components/Badge";
import { EventStatusActions } from "@/components/EventStatusActions";
import type { Event } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-900",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function ProDashboard() {
  const pro = await getMyProfessional();
  const cities = await getCities();

  if (!pro) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold">Complete your professional profile</h1>
        <ProProfileForm cities={cities.filter((c) => c.is_active)} existing={null} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: eventsRaw } = await supabase.from("events").select("*").eq("professional_id", pro.id).order("starts_at", { ascending: false });
  const events = await attachCounts((eventsRaw ?? []) as Event[]);

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <div className="text-xs text-muted">Your profile</div>
          <div className="font-semibold text-lg flex items-center gap-2">{pro.display_name} <Badge badge={pro.badge} /></div>
          <div className="text-sm text-muted">{pro.category}</div>
          <div className="mt-1">
            {pro.status === "approved" && <span className="badge bg-green-100 text-green-800">Approved – you can publish events</span>}
            {pro.status === "pending" && <span className="badge bg-yellow-100 text-yellow-900">Awaiting verification – usually 1–2 working days</span>}
            {pro.status === "rejected" && <span className="badge bg-red-100 text-red-800">Not approved{pro.admin_note ? `: ${pro.admin_note}` : ""}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/pro/profile" className="btn-secondary">Edit profile</Link>
          {pro.status === "approved" && <Link href="/pro/events/new" className="btn-primary">+ New event</Link>}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Your events</h2>
        {events.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            No events yet.{pro.status === "approved" && <> <Link href="/pro/events/new" className="underline text-brand">Create your first event</Link>.</>}
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {events.map((e) => (
              <div key={e.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.title}</div>
                  <div className="text-sm text-muted">{fmtDateTime(e.starts_at)} · {e.registered_count} registered{e.capacity ? ` / ${e.capacity}` : ""}</div>
                  {e.admin_note && e.status !== "published" && <div className="text-xs text-red-700">Admin: {e.admin_note}</div>}
                </div>
                <span className={`badge ${STATUS[e.status]}`}>{e.status}</span>
                <div className="flex gap-2 text-sm">
                  <Link href={`/pro/events/${e.id}/registrations`} className="btn-secondary !py-1.5">Registrations</Link>
                  <Link href={`/pro/events/${e.id}/edit`} className="btn-secondary !py-1.5">Edit</Link>
                  <EventStatusActions id={e.id} status={e.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
