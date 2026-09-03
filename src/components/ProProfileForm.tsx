"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PRO_CATEGORIES } from "@/lib/constants";
import type { City, Professional } from "@/lib/types";
import { saveProfessionalProfile } from "@/app/actions/pro";

export function ProProfileForm({ cities, existing }: { cities: City[]; existing: Professional | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setOk(false);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("credentials") as File | null;
    fd.delete("credentials");
    if (file && file.size > 0) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("credentials").upload(path, file);
      if (error) return setErr(`Upload failed: ${error.message}`);
      fd.set("credentials_url", path);
    }
    start(async () => {
      const r = await saveProfessionalProfile(fd);
      if (r.error) setErr(r.error);
      else { setOk(true); router.refresh(); if (!existing) router.push("/pro"); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className="label">Name shown to parents *</label><input name="display_name" className="input" required defaultValue={existing?.display_name ?? ""} /></div>
        <div>
          <label className="label">You are a *</label>
          <select name="category" className="input" required defaultValue={existing?.category ?? PRO_CATEGORIES[0]}>
            {PRO_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">City *</label>
          <select name="city_id" className="input" required defaultValue={existing?.city_id ?? cities[0]?.id}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label className="label">Area / locality</label><input name="area" className="input" defaultValue={existing?.area ?? ""} /></div>
        <div><label className="label">WhatsApp number *</label><input name="whatsapp" className="input" required defaultValue={existing?.whatsapp ?? ""} /></div>
        <div><label className="label">Phone</label><input name="phone" className="input" defaultValue={existing?.phone ?? ""} /></div>
        <div><label className="label">Instagram</label><input name="instagram" className="input" defaultValue={existing?.instagram ?? ""} /></div>
        <div className="sm:col-span-2"><label className="label">Website</label><input name="website" className="input" defaultValue={existing?.website ?? ""} /></div>
        <div className="sm:col-span-2"><label className="label">About you</label><textarea name="bio" className="input" rows={3} defaultValue={existing?.bio ?? ""} /></div>
        <div className="sm:col-span-2">
          <label className="label">Credentials {existing?.credentials_url ? "(uploaded ✔ – upload again to replace)" : "(PDF or image)"}</label>
          <input name="credentials" type="file" accept=".pdf,image/*" className="input" />
        </div>
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : existing ? "Save changes" : "Submit for verification"}</button>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {ok && <p className="text-xs text-green-700">Saved.</p>}
    </form>
  );
}
