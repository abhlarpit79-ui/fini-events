import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/utils";
import { ageBandLabel } from "@/lib/constants";
import { FeedbackForm } from "@/components/FeedbackForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
  attended: "Attended",
  no_show: "Missed",
};


interface RegRow {
  id: string;
  status: string;
  child_age_band: string;
  event: { id: string; title: string; starts_at: string; mode: string; venue_name: string | null; area: string | null; online_link: string | null; status: string };
}

function splitRows(rows: RegRow[]) {
  const now = Date.now();
  return {
    upcoming: rows.filter((r) => new Date(r.event.starts_at).getTime() >= now && r.status !== "cancelled"),
    past: rows.filter((r) => new Date(r.event.starts_at).getTime() < now || r.status === "cancelled"),
  };
}

function Row({ r, showFeedback, rated }: { r: RegRow; showFeedback: boolean; rated: Map<string, number> }) {
  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <Link href={`/events/${r.event.id}`} className="font-semibold hover:underline">{r.event.title}</Link>
        <div className="text-sm text-muted">
          {fmtDateTime(r.event.starts_at)} · {r.event.mode === "online" ? "Online" : [r.event.venue_name, r.event.area].filter(Boolean).join(", ")}
        </div>
        <div className="text-xs text-muted">Child: {ageBandLabel(r.child_age_band)}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`badge ${r.status === "waitlisted" ? "bg-yellow-100 text-yellow-900" : r.status === "cancelled" ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-800"}`}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
        {r.event.online_link && ["registered", "attended"].includes(r.status) && !showFeedback && (
          <a className="btn-primary !py-1.5 text-xs" href={r.event.online_link} target="_blank" rel="noreferrer">Join</a>
        )}
      </div>
      {showFeedback && ["registered", "attended"].includes(r.status) && (
        <FeedbackForm eventId={r.event.id} existing={rated.get(r.event.id) ?? null} />
      )}
    </div>
  );
}

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: regs } = await supabase
    .from("registrations")
    .select("*, event:events(id,title,starts_at,mode,venue_name,area,online_link,status)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });
  const { data: fb } = await supabase.from("feedback").select("event_id,rating").eq("user_id", user!.id);
  const rated = new Map((fb ?? []).map((f) => [f.event_id, f.rating]));

  const rows = (regs ?? []).filter((r) => r.event) as RegRow[];
  const { upcoming, past } = splitRows(rows);
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold">My events</h1>
      <section className="space-y-3">
        <h2 className="font-semibold text-muted text-sm uppercase tracking-wide">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            Nothing booked yet. <Link href="/" className="underline text-brand">Browse events</Link>
          </div>
        ) : upcoming.map((r) => <Row key={r.id} r={r} showFeedback={false} rated={rated} />)}
      </section>
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-muted text-sm uppercase tracking-wide">Past</h2>
          {past.map((r) => <Row key={r.id} r={r} showFeedback={r.status !== "cancelled"} rated={rated} />)}
        </section>
      )}
    </div>
  );
}
