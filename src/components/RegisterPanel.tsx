"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AGE_BANDS, WHATSAPP_OPT_IN_TEXT } from "@/lib/constants";
import { registerForEvent, cancelRegistration } from "@/app/actions/registration";

export function RegisterPanel(props: {
  eventId: string;
  eventStatus: string;
  past: boolean;
  full: boolean;
  ageBands: string[];
  loggedIn: boolean;
  isParent: boolean;
  defaults: { name: string; phone: string; optIn: boolean };
  existing: { status: string } | null;
  onlineLink: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const bands = AGE_BANDS.filter((b) => props.ageBands.includes(b.value));

  const active = ["registered", "attended", "waitlisted"].includes(props.existing?.status ?? "");

  if (props.eventStatus !== "published" || props.past) {
    return <div className="card p-5 text-center text-muted text-sm">{props.past ? "This event has already taken place." : "Registrations are closed."}</div>;
  }

  if (active) {
    const wait = props.existing?.status === "waitlisted";
    return (
      <div className="card p-5 space-y-3">
        <div className={`rounded-xl p-3 text-sm ${wait ? "bg-yellow-50 text-yellow-900" : "bg-green-50 text-green-900"}`}>
          {wait ? "You're on the waitlist. We'll move you in if a seat frees up." : "You're registered! See you there."}
        </div>
        {props.onlineLink && (
          <a href={props.onlineLink} target="_blank" rel="noreferrer" className="btn-primary w-full">Join online session</a>
        )}
        <button
          className="btn-secondary w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelRegistration(props.eventId);
              if (r.error) setErr(r.error);
              else router.refresh();
            })
          }
        >
          Cancel my registration
        </button>
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    );
  }

  if (!props.loggedIn) {
    return (
      <div className="card p-5 space-y-3">
        <div className="font-semibold">{props.full ? "Join the waitlist" : "Register – it's free"}</div>
        <p className="text-sm text-muted">Log in with your mobile number to register in one tap.</p>
        <Link href={`/login?next=/events/${props.eventId}`} className="btn-primary w-full">Log in with mobile OTP</Link>
      </div>
    );
  }

  if (!props.isParent) {
    return <div className="card p-5 text-sm text-muted">You are logged in as a professional. Parents register with their mobile number.</div>;
  }

  return (
    <form
      className="card p-5 space-y-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        setErr(null);
        const fd = new FormData(ev.currentTarget);
        start(async () => {
          const r = await registerForEvent(props.eventId, fd);
          if (r.error) setErr(r.error);
          else {
            setOk(r.status === "waitlisted" ? "Added to waitlist" : "Registered!");
            router.refresh();
          }
        });
      }}
    >
      <div className="font-semibold">{props.full ? "Join the waitlist" : "Register – it's free"}</div>
      <div>
        <label className="label">Your name</label>
        <input name="parent_name" className="input" required defaultValue={props.defaults.name} />
      </div>
      <div>
        <label className="label">Mobile (WhatsApp)</label>
        <input name="phone" className="input" required inputMode="tel" defaultValue={props.defaults.phone} placeholder="98765 43210" />
      </div>
      <div>
        <label className="label">Your child&apos;s age</label>
        <select name="child_age_band" className="input" required defaultValue={bands[0]?.value}>
          {(bands.length ? bands : AGE_BANDS).map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>
      <label className="flex gap-2 items-start text-xs text-muted">
        <input type="checkbox" name="opt_in" defaultChecked={props.defaults.optIn} className="mt-0.5" />
        <span>{WHATSAPP_OPT_IN_TEXT}</span>
      </label>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : props.full ? "Join waitlist" : "Confirm registration"}
      </button>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {ok && <p className="text-xs text-green-700">{ok}</p>}
      <p className="text-[11px] text-muted">By registering you agree to the host&apos;s terms for this event and our <Link href="/terms" className="underline">terms</Link>.</p>
    </form>
  );
}
