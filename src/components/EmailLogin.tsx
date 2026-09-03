"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EmailLogin({ next }: { next: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(next);
    router.refresh();
  }

  async function reset(email: string) {
    if (!email) return setErr("Enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/pro/login` });
    if (error) setErr(error.message); else setMsg("Password reset email sent.");
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div><label className="label">Email</label><input name="email" type="email" className="input" required autoFocus /></div>
      <div><label className="label">Password</label><input name="password" type="password" className="input" required /></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <button type="button" className="text-xs text-muted underline w-full" onClick={(e) => reset(((e.currentTarget.form as HTMLFormElement).elements.namedItem("email") as HTMLInputElement).value)}>
        Forgot password?
      </button>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {msg && <p className="text-xs text-green-700">{msg}</p>}
    </form>
  );
}
