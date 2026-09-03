"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalisePhone } from "@/lib/utils";

export function OtpLogin({ next }: { next: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const p = normalisePhone(phone);
    if (!p) return setErr("Enter a valid 10-digit Indian mobile number.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: p, options: { channel: "sms" } });
    setBusy(false);
    if (error) return setErr(error.message);
    setStep("otp");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: normalisePhone(phone)!, token: otp.trim(), type: "sms" });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(next);
    router.refresh();
  }

  return step === "phone" ? (
    <form onSubmit={sendOtp} className="card p-5 space-y-3">
      <div>
        <label className="label">Mobile number</label>
        <div className="flex gap-2">
          <span className="input w-16 text-center bg-orange-50">+91</span>
          <input className="input" inputMode="tel" autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
        </div>
      </div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send OTP"}</button>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </form>
  ) : (
    <form onSubmit={verify} className="card p-5 space-y-3">
      <p className="text-sm">Enter the 6-digit code sent to <b>+91 {phone}</b></p>
      <input className="input tracking-[0.4em] text-center text-lg" inputMode="numeric" autoFocus maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
      <button className="btn-primary w-full" disabled={busy || otp.length < 4}>{busy ? "Verifying…" : "Verify & continue"}</button>
      <button type="button" className="text-xs text-muted underline w-full" onClick={() => setStep("phone")}>Change number</button>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </form>
  );
}
