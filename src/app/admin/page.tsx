import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";

function Stat({ n, label, href, warn }: { n: number; label: string; href?: string; warn?: boolean }) {
  return (
    <Link href={href ?? "#"} className={`card p-4 ${warn && n > 0 ? "border-yellow-400 bg-yellow-50" : ""}`}>
      <div className="text-2xl font-bold">{n}</div>
      <div className="text-xs text-muted">{label}</div>
    </Link>
  );
}

export default async function AdminHome() {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const head = { count: "exact" as const, head: true };
  const n = (r: { count: number | null }) => r.count ?? 0;
  const [pros, prosPending, events, eventsPending, upcoming, regs, parents] = await Promise.all([
    db.from("professionals").select("*", head).eq("status", "approved").then(n),
    db.from("professionals").select("*", head).eq("status", "pending").then(n),
    db.from("events").select("*", head).eq("status", "published").then(n),
    db.from("events").select("*", head).eq("status", "pending").then(n),
    db.from("events").select("*", head).eq("status", "published").gte("starts_at", now).then(n),
    db.from("registrations").select("*", head).in("status", ["registered", "attended"]).then(n),
    db.from("profiles").select("*", head).eq("role", "parent").then(n),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Overview</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat n={prosPending} label="Professionals awaiting verification" href="/admin/professionals?status=pending" warn />
        <Stat n={eventsPending} label="Events awaiting approval" href="/admin/events?status=pending" warn />
        <Stat n={pros} label="Approved professionals" href="/admin/professionals" />
        <Stat n={events} label="Published events (all time)" href="/admin/events" />
        <Stat n={upcoming} label="Upcoming events" href="/" />
        <Stat n={regs} label="Registrations" />
        <Stat n={parents} label="Parent accounts" />
      </div>
      <div className="card p-4 text-sm text-muted">
        Free-phase KPIs to watch: verified professionals, events per month, registrations per event, attendance %, repeat parents.
      </div>
    </div>
  );
}
