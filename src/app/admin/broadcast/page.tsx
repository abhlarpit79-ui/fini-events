import { createAdminClient } from "@/lib/supabase/server";
import { ageBandLabel, SITE_NAME } from "@/lib/constants";
import { fmtDate, fmtTime, fmtFee, eventUrl, windowFor, waShare } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";
import Link from "next/link";

export default async function BroadcastPage({ searchParams }: PageProps<"/admin/broadcast">) {
  const sp = await searchParams;
  const when = typeof sp.when === "string" ? sp.when : "week";
  const city = typeof sp.city === "string" ? sp.city : "";
  const age = typeof sp.age === "string" ? sp.age : "";
  const db = createAdminClient();
  const { from, to } = windowFor(when);
  let q = db
    .from("events")
    .select("id,title,starts_at,mode,venue_name,area,fee,age_bands,is_featured, city:cities(name)")
    .eq("status", "published")
    .gte("starts_at", from)
    .order("starts_at");
  if (to) q = q.lt("starts_at", to);
  if (city) q = q.eq("city_id", Number(city));
  if (age) q = q.contains("age_bands", [age]);
  const { data: events } = await q;
  const { data: cities } = await db.from("cities").select("id,name").eq("is_active", true).order("name");

  const { count: optIns } = await db.from("profiles").select("*", { count: "exact", head: true }).eq("whatsapp_opt_in", true);

  const label = when === "today" ? "today" : when === "weekend" ? "this weekend" : "this week";
  const lines = [
    `👶 *${SITE_NAME} – things to do with your little one ${label}*`,
    "",
    ...(events ?? []).flatMap((e) => [
      `${e.is_featured ? "★ " : "▪️ "}*${e.title}*`,
      `   ${fmtDate(e.starts_at)}, ${fmtTime(e.starts_at)} · ${e.mode === "online" ? "Online" : [e.venue_name, e.area].filter(Boolean).join(", ")} · ${fmtFee(e.fee)}`,
      `   For ${e.age_bands.map(ageBandLabel).join(" / ")} → ${eventUrl(e.id)}`,
      "",
    ]),
    `Register free in one tap. Reply STOP to opt out.`,
  ];
  const text = lines.join("\n");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">WhatsApp broadcast</h1>
      <p className="text-sm text-muted">
        Generates the weekly picks message. Copy it into your WhatsApp Business broadcast list (only parents who opted in – currently <b>{optIns ?? 0}</b> accounts). Export their numbers from the Supabase table <code>profiles</code> where <code>whatsapp_opt_in = true</code>.
      </p>
      <div className="flex gap-2 flex-wrap">
        {[["today", "Today"], ["weekend", "Weekend"], ["week", "Next 7 days"], ["", "All upcoming"]].map(([v, l]) => (
          <Link key={v} href={`/admin/broadcast?when=${v}&city=${city}&age=${age}`} className={`chip ${when === v ? "chip-active" : ""}`}>{l}</Link>
        ))}
        <span className="border-l border-border" />
        <Link href={`/admin/broadcast?when=${when}&age=${age}`} className={`chip ${!city ? "chip-active" : ""}`}>All cities</Link>
        {(cities ?? []).map((c) => (
          <Link key={c.id} href={`/admin/broadcast?when=${when}&city=${c.id}&age=${age}`} className={`chip ${city === String(c.id) ? "chip-active" : ""}`}>{c.name}</Link>
        ))}
      </div>
      <div className="card p-4 space-y-2">
        <div className="text-sm text-muted">{events?.length ?? 0} events in this message</div>
        <textarea className="input font-mono text-xs" rows={Math.min(30, 4 + (events?.length ?? 0) * 4)} readOnly value={text} />
        <div className="flex gap-2">
          <CopyButton text={text} />
          <a className="btn-whatsapp !py-1.5 text-xs" href={waShare(text)} target="_blank" rel="noreferrer">Open in WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
