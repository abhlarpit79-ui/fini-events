import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent, getCurrentProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { ageBandLabel, categoryMeta } from "@/lib/constants";
import { fmtDateTime, fmtTime, fmtFee, eventShareText, waShare, waLink } from "@/lib/utils";
import { Badge } from "@/components/Badge";
import { RegisterPanel } from "@/components/RegisterPanel";
import type { Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) notFound();

  const { user, profile } = await getCurrentProfile();
  let myReg: Registration | null = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    myReg = data;
  }

  const cat = categoryMeta(e.category);
  const shareText = eventShareText(e, ageBandLabel);
  const full = e.capacity != null && (e.registered_count ?? 0) >= e.capacity;
  const past = new Date(e.starts_at) < new Date();

  return (
    <article className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <div className="card overflow-hidden">
          <div className="h-56 sm:h-72 bg-orange-100">
            {e.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">{cat.emoji}</div>
            )}
          </div>
          <div className="p-5 space-y-3">
            <div className="text-xs text-muted flex items-center gap-2">
              <span>{cat.emoji} {cat.label}</span>
              {e.is_featured && <span className="badge bg-yellow-300 text-yellow-900">★ Featured</span>}
              {e.status === "cancelled" && <span className="badge bg-red-100 text-red-800">Cancelled</span>}
            </div>
            <h1 className="text-2xl font-bold leading-tight">{e.title}</h1>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><dt className="text-muted">When</dt><dd className="font-medium">{fmtDateTime(e.starts_at)}{e.ends_at ? ` – ${fmtTime(e.ends_at)}` : ""}</dd></div>
              <div>
                <dt className="text-muted">Where</dt>
                <dd className="font-medium">
                  {e.mode === "online" ? "Online (link shared after registration)" : (
                    <>
                      {e.venue_name}{e.area ? `, ${e.area}` : ""}, {e.city.name}
                      {e.address && <div className="text-muted font-normal">{e.address}</div>}
                      {e.map_url && <a href={e.map_url} target="_blank" rel="noreferrer" className="text-brand underline text-xs">Open in Maps</a>}
                    </>
                  )}
                </dd>
              </div>
              <div><dt className="text-muted">For</dt><dd className="font-medium">{e.age_bands.map(ageBandLabel).join(" · ")}</dd></div>
              <div><dt className="text-muted">Fee</dt><dd className="font-medium">{fmtFee(e.fee)}{e.fee_note ? <span className="text-muted font-normal"> — {e.fee_note}</span> : null}</dd></div>
              {e.capacity && <div><dt className="text-muted">Seats</dt><dd className="font-medium">{Math.max(e.capacity - (e.registered_count ?? 0), 0)} of {e.capacity} left</dd></div>}
            </dl>
          </div>
        </div>

        <section className="card p-5 space-y-2">
          <h2 className="font-semibold">About this event</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{e.description}</p>
          {e.what_to_bring && (
            <>
              <h3 className="font-semibold pt-2">What to bring</h3>
              <p className="whitespace-pre-line text-sm">{e.what_to_bring}</p>
            </>
          )}
        </section>

        <section className="card p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">👩‍⚕️</div>
          <div className="flex-1">
            <div className="text-xs text-muted">Hosted by</div>
            <div className="font-semibold flex items-center gap-2">{e.professional.display_name} <Badge badge={e.professional.badge} /></div>
            <div className="text-sm text-muted">{e.professional.category}{e.professional.area ? ` · ${e.professional.area}` : ""}</div>
            {e.professional.whatsapp && (
              <a href={waLink(e.professional.whatsapp, `Hi, I have a question about "${e.title}" listed on FINI Events.`)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5 mt-2 text-xs">
                Ask a question on WhatsApp
              </a>
            )}
          </div>
        </section>

        <p className="text-xs text-muted">
          This event is organised and run by the host above. Fees, if any, are paid to the host directly. FINI Events only lists the event and does not charge parents or hosts.
        </p>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 self-start">
        <RegisterPanel
          eventId={e.id}
          eventStatus={e.status}
          past={past}
          full={full}
          ageBands={e.age_bands}
          loggedIn={!!user}
          isParent={!profile || profile.role === "parent"}
          defaults={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", optIn: profile?.whatsapp_opt_in ?? true }}
          existing={myReg ? { status: myReg.status } : null}
          onlineLink={myReg && ["registered", "attended"].includes(myReg.status) ? e.online_link : null}
        />
        <a href={waShare(shareText)} target="_blank" rel="noreferrer" className="btn-secondary w-full">
          Share on WhatsApp
        </a>
        <Link href="/" className="block text-center text-sm text-muted underline">← Back to all events</Link>
      </aside>
    </article>
  );
}
