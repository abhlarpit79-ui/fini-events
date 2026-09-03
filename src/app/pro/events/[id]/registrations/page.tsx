import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMyProfessional } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { ageBandLabel } from "@/lib/constants";
import { fmtDateTime, waLink, waShare, eventShareText } from "@/lib/utils";
import { AttendanceButtons } from "@/components/AttendanceButtons";
import { CopyButton } from "@/components/CopyButton";
import type { Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({ params, searchParams }: PageProps<"/pro/events/[id]/registrations">) {
  const { id } = await params;
  const sp = await searchParams;
  const pro = await getMyProfessional();
  if (!pro) redirect("/pro");
  const supabase = await createClient();
  const { data: e } = await supabase.from("events").select("*").eq("id", id).eq("professional_id", pro.id).maybeSingle();
  if (!e) notFound();
  const { data: regs } = await supabase.from("registrations").select("*").eq("event_id", id).order("created_at");
  const { data: fb } = await supabase.from("feedback").select("rating,comment").eq("event_id", id);

  const list = (regs ?? []) as Registration[];
  const active = list.filter((r) => ["registered", "attended", "no_show"].includes(r.status));
  const wait = list.filter((r) => r.status === "waitlisted");
  const avg = fb?.length ? (fb.reduce((a, b) => a + b.rating, 0) / fb.length).toFixed(1) : null;

  const reminder = `Hi {name}! Reminder: *${e.title}* is on ${fmtDateTime(e.starts_at)}${e.mode === "online" ? ` (online: ${e.online_link ?? "link to follow"})` : ` at ${e.venue_name}${e.area ? ", " + e.area : ""}`}.${e.what_to_bring ? ` Please bring: ${e.what_to_bring}.` : ""} See you there – ${pro.display_name}`;

  return (
    <div className="space-y-5">
      {sp.saved && (
        <div className="rounded-xl bg-green-50 text-green-900 p-3 text-sm">
          Event saved. {e.status === "pending" ? "It will appear publicly once our team approves it (usually within a day)." : "It is live."}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/pro" className="text-xs text-muted underline">← Dashboard</Link>
          <h1 className="text-xl font-bold">{e.title}</h1>
          <div className="text-sm text-muted">{fmtDateTime(e.starts_at)} · status: <b>{e.status}</b>{avg && <> · rating {avg}★ ({fb!.length})</>}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/events/${e.id}`} className="btn-secondary !py-1.5">View public page</Link>
          <a href={waShare(eventShareText(e, ageBandLabel))} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5">Share on WhatsApp</a>
          {active.length > 0 && <a href={`/pro/events/${e.id}/registrations/export`} className="btn-secondary !py-1.5">Download CSV</a>}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-center">
        <div className="card p-4"><div className="text-2xl font-bold">{active.filter((r) => r.status !== "no_show").length}</div><div className="text-xs text-muted">Registered{e.capacity ? ` of ${e.capacity}` : ""}</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">{wait.length}</div><div className="text-xs text-muted">Waitlisted</div></div>
        <div className="card p-4"><div className="text-2xl font-bold">{active.filter((r) => r.status === "attended").length}</div><div className="text-xs text-muted">Attended</div></div>
      </div>

      <section className="card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Reminder message (WhatsApp)</h2>
        <p className="text-xs text-muted">Tap the WhatsApp icon next to each parent to open a chat with this message pre-filled. Parents who opted in are marked ✔.</p>
        <textarea className="input text-xs" rows={3} readOnly value={reminder} />
        <CopyButton text={reminder} />
      </section>

      <Table title="Registered" rows={active} reminder={reminder} />
      {wait.length > 0 && <Table title="Waitlist" rows={wait} reminder={reminder} />}

      {fb && fb.length > 0 && (
        <section className="card p-4 space-y-2">
          <h2 className="font-semibold text-sm">Parent feedback</h2>
          {fb.map((f, i) => (
            <div key={i} className="text-sm"><span className="text-yellow-500">{"★".repeat(f.rating)}</span> {f.comment}</div>
          ))}
        </section>
      )}
    </div>
  );
}

function Table({ title, rows, reminder }: { title: string; rows: Registration[]; reminder: string }) {
  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3 font-semibold text-sm border-b border-border">{title} ({rows.length})</div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted">No one yet. Share the event link on WhatsApp and Instagram.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted text-left">
              <tr><th className="px-4 py-2">Parent</th><th className="px-4 py-2">Mobile</th><th className="px-4 py-2">Child</th><th className="px-4 py-2">WA</th><th className="px-4 py-2">Attendance</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-medium">{r.parent_name}</td>
                  <td className="px-4 py-2">
                    <a className="text-[#128C7E] underline" href={waLink(r.phone, reminder.replace("{name}", r.parent_name.split(" ")[0]))} target="_blank" rel="noreferrer">{r.phone}</a>
                  </td>
                  <td className="px-4 py-2">{ageBandLabel(r.child_age_band)}</td>
                  <td className="px-4 py-2">{r.whatsapp_opt_in ? "✔" : "–"}</td>
                  <td className="px-4 py-2">{r.status === "waitlisted" ? <span className="badge bg-yellow-100 text-yellow-900">waitlist</span> : <AttendanceButtons id={r.id} status={r.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
