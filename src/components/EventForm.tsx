"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { AGE_BANDS, CATEGORIES, EVENT_MODES } from "@/lib/constants";
import type { City, Event } from "@/lib/types";
import { saveEvent } from "@/app/actions/pro";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function EventForm({ cities, existing, defaultCity }: { cities: City[]; existing: Event | null; defaultCity: number | null }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState(existing?.mode ?? "venue");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    setUploading(false);
    if (error) return setErr(`Image upload failed: ${error.message}`);
    setImageUrl(supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl);
  }

  return (
    <form
      className="card p-5 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const fd = new FormData(e.currentTarget);
        fd.set("image_url", imageUrl);
        fd.set("save_as", (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "submit");
        start(async () => {
          const r = await saveEvent(existing?.id ?? null, fd);
          if (r?.error) setErr(r.error);
        });
      }}
    >
      <section className="space-y-3">
        <h2 className="font-semibold">Basics</h2>
        <div><label className="label">Event title *</label><input name="title" className="input" required defaultValue={existing?.title ?? ""} placeholder="Starting Solids Workshop for 6–9 month olds" /></div>
        <div><label className="label">Description *</label><textarea name="description" className="input" rows={5} required defaultValue={existing?.description ?? ""} placeholder="What will parents learn / do? Who is it for? What's included?" /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Category *</label>
            <select name="category" className="input" required defaultValue={existing?.category ?? ""}>
              <option value="" disabled>Choose…</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">City *</label>
            <select name="city_id" className="input" required defaultValue={existing?.city_id ?? defaultCity ?? cities[0]?.id}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Suitable for *</label>
          <div className="flex flex-wrap gap-2">
            {AGE_BANDS.map((b) => (
              <label key={b.value} className="chip cursor-pointer has-[:checked]:bg-brand has-[:checked]:text-white has-[:checked]:border-brand">
                <input type="checkbox" name="age_bands" value={b.value} className="sr-only" defaultChecked={existing?.age_bands.includes(b.value)} />
                {b.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">When & where</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Starts (IST) *</label><input name="starts_at" type="datetime-local" className="input" required defaultValue={toLocalInput(existing?.starts_at ?? null)} /></div>
          <div><label className="label">Ends (IST)</label><input name="ends_at" type="datetime-local" className="input" defaultValue={toLocalInput(existing?.ends_at ?? null)} /></div>
        </div>
        <div className="flex gap-2">
          {EVENT_MODES.map((m) => (
            <label key={m.value} className={`chip cursor-pointer ${mode === m.value ? "chip-active" : ""}`}>
              <input type="radio" name="mode" value={m.value} className="sr-only" checked={mode === m.value} onChange={() => setMode(m.value)} />
              {m.label}
            </label>
          ))}
        </div>
        {mode === "venue" ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Venue name *</label><input name="venue_name" className="input" defaultValue={existing?.venue_name ?? ""} /></div>
            <div><label className="label">Area / locality</label><input name="area" className="input" defaultValue={existing?.area ?? ""} placeholder="Bandra West" /></div>
            <div className="sm:col-span-2"><label className="label">Full address</label><input name="address" className="input" defaultValue={existing?.address ?? ""} /></div>
            <div className="sm:col-span-2"><label className="label">Google Maps link</label><input name="map_url" className="input" defaultValue={existing?.map_url ?? ""} placeholder="https://maps.app.goo.gl/…" /></div>
          </div>
        ) : (
          <div><label className="label">Meeting link (shown only to registered parents)</label><input name="online_link" className="input" defaultValue={existing?.online_link ?? ""} placeholder="https://meet.google.com/…" /></div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Details</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="label">Capacity (blank = unlimited)</label><input name="capacity" type="number" min={1} className="input" defaultValue={existing?.capacity ?? ""} /></div>
          <div><label className="label">Fee ₹ (0 = free)</label><input name="fee" type="number" min={0} step="1" className="input" defaultValue={existing?.fee ?? 0} /></div>
          <div><label className="label">Fee note</label><input name="fee_note" className="input" defaultValue={existing?.fee_note ?? ""} placeholder="Pay at venue / UPI on arrival" /></div>
        </div>
        <div><label className="label">What to bring</label><textarea name="what_to_bring" className="input" rows={2} defaultValue={existing?.what_to_bring ?? ""} placeholder="Yoga mat, a muslin cloth, baby's favourite toy" /></div>
        <div>
          <label className="label">Cover image</label>
          <input type="file" accept="image/*" className="input" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {uploading && <p className="text-xs text-muted">Uploading…</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mt-2 h-28 rounded-xl object-cover" />
          )}
        </div>
      </section>

      <p className="text-xs text-muted">
        Fees shown here are collected by you directly from parents. The platform does not process payments. New events are reviewed by the FINI team before going live.
      </p>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" value="submit" disabled={pending || uploading}>{pending ? "Saving…" : existing?.status === "published" ? "Save changes" : "Submit for review"}</button>
        {existing?.status !== "published" && <button className="btn-secondary" value="draft" disabled={pending || uploading}>Save draft</button>}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
