import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ageBandLabel } from "@/lib/constants";
import { csvEscape, fmtDateTime } from "@/lib/utils";

export async function GET(_req: Request, ctx: RouteContext<"/pro/events/[id]/registrations/export">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  // RLS ensures only the event's professional (or admin) sees rows.
  const { data: e } = await supabase.from("events").select("title,starts_at").eq("id", id).maybeSingle();
  if (!e) return new NextResponse("Not found", { status: 404 });
  const { data: regs } = await supabase.from("registrations").select("*").eq("event_id", id).order("created_at");

  const header = ["Name", "Mobile", "Child age", "Status", "WhatsApp opt-in", "Registered at"];
  const lines = [header.join(",")].concat(
    (regs ?? []).map((r) =>
      [r.parent_name, r.phone, ageBandLabel(r.child_age_band), r.status, r.whatsapp_opt_in ? "yes" : "no", fmtDateTime(r.created_at)]
        .map(csvEscape)
        .join(","),
    ),
  );
  const safe = e.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${safe}.csv"`,
    },
  });
}
