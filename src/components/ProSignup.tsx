"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PRO_CATEGORIES } from "@/lib/constants";
import type { City } from "@/lib/types";

export function ProSignup({ cities }: { cities: City[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));
    const display_name = String(fd.get("display_name")).trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "professional", full_name: display_name } },
    });
    if (error) { setBusy(false); return setErr(error.message); }

    // If email confirmation is ON in Supabase, there is no session yet.
    if (!data.session) { setBusy(false); return setNeedsConfirm(true); }

    let credentials_url: string | null = null;
    const file = fd.get("credentials") as File | null;
    if (file && file.size > 0) {
      const path = `${data.user!.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("credentials").upload(path, file);
      if (!upErr) credentials_url = path;
    }

    const { error: insErr } = await supabase.from("professionals").insert({
      user_id: data.user!.id,
      display_name,
      category: String(fd.get("category")),
      bio: String(fd.get("bio") || "") || null,
      city_id: Number(fd.get("city_id")) || null,
      area: String(fd.get("area") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      whatsapp: String(fd.get("whatsapp") || "") || null,
      website: String(fd.get("website") || "") || null,
      instagram: String(fd.get("instagram") || "") || null,
      credentials_url,
    });
    setBusy(false);
    if (insErr) return setErr(insErr.message);
    router.push("/pro");
    router.refresh();
  }

  if (needsConfirm) {
    return (
      <div className="card p-5 text-sm">
        Check your email to confirm your account, then <a href="/pro/login" className="underline text-brand">log in</a> to complete your profile.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className="label">Name shown to parents *</label><input name="display_name" className="input" required placeholder="Dr. Meera Shah / Little Steps Play Studio" /></div>
        <div><label className="label">Email *</label><input name="email" type="email" className="input" required /></div>
        <div><label className="label">Password *</label><input name="password" type="password" className="input" required minLength={8} /></div>
        <div>
          <label className="label">You are a *</label>
          <select name="category" className="input" required>
            {PRO_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">City *</label>
          <select name="city_id" className="input" required>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label className="label">Area / locality</label><input name="area" className="input" placeholder="Andheri West" /></div>
        <div><label className="label">WhatsApp number *</label><input name="whatsapp" className="input" required inputMode="tel" placeholder="98765 43210" /></div>
        <div><label className="label">Phone (if different)</label><input name="phone" className="input" inputMode="tel" /></div>
        <div><label className="label">Instagram</label><input name="instagram" className="input" placeholder="@handle" /></div>
        <div className="sm:col-span-2"><label className="label">Website</label><input name="website" className="input" placeholder="https://" /></div>
        <div className="sm:col-span-2"><label className="label">About you</label><textarea name="bio" className="input" rows={3} placeholder="Qualifications, experience, what you offer to parents of 0–3 year olds" /></div>
        <div className="sm:col-span-2">
          <label className="label">Credentials (degree / registration / certificate) – PDF or image</label>
          <input name="credentials" type="file" accept=".pdf,image/*" className="input" />
          <p className="text-xs text-muted mt-1">Seen only by our verification team. Required before your first event is published.</p>
        </div>
      </div>
      <label className="flex gap-2 text-xs text-muted">
        <input type="checkbox" required className="mt-0.5" />
        <span>
          I confirm I am the organiser of the events I list, responsible for their safety, delivery and any fees, and I agree to the{" "}
          <a href="/terms" className="underline">listing terms</a>.
        </span>
      </label>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create professional account"}</button>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <p className="text-xs text-center text-muted">Already have an account? <a href="/pro/login" className="underline">Log in</a></p>
    </form>
  );
}
