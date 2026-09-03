import { SITE_URL, SITE_NAME } from "./constants";

const TZ = "Asia/Kolkata";

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}
export function fmtDateTime(iso: string) {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}
export function fmtFee(fee: number) {
  return fee > 0 ? `₹${Number(fee).toLocaleString("en-IN")}` : "Free";
}

/** Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX). */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+${digits.slice(1)}`;
  return null;
}
export function waNumber(raw: string) {
  return raw.replace(/\D/g, "").replace(/^0+/, "").replace(/^(\d{10})$/, "91$1");
}

/** wa.me click-to-chat link */
export function waLink(phone: string, text?: string) {
  const n = waNumber(phone);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
/** WhatsApp share (no recipient) */
export function waShare(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function eventUrl(id: string) {
  return `${SITE_URL}/events/${id}`;
}

export function eventShareText(e: {
  id: string;
  title: string;
  starts_at: string;
  venue_name?: string | null;
  area?: string | null;
  mode: string;
  fee: number;
  age_bands: string[];
}, ageLabel: (v: string) => string) {
  const where = e.mode === "online" ? "Online" : [e.venue_name, e.area].filter(Boolean).join(", ");
  return [
    `*${e.title}*`,
    `📅 ${fmtDateTime(e.starts_at)}`,
    where ? `📍 ${where}` : null,
    `👶 ${e.age_bands.map(ageLabel).join(" · ")}`,
    `💰 ${fmtFee(e.fee)}`,
    ``,
    `Register free on ${SITE_NAME}: ${eventUrl(e.id)}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/** Start/end of "today" and "this weekend" in IST, returned as ISO strings. */
export function windowFor(when: string | undefined) {
  const now = new Date();
  // shift to IST wall-clock
  const ist = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const startOfDay = new Date(ist);
  startOfDay.setHours(0, 0, 0, 0);
  const offsetMs = ist.getTime() - now.getTime();
  const toUtcIso = (d: Date) => new Date(d.getTime() - offsetMs).toISOString();

  if (when === "today") {
    const end = new Date(startOfDay);
    end.setDate(end.getDate() + 1);
    return { from: now.toISOString(), to: toUtcIso(end) };
  }
  if (when === "weekend") {
    const day = ist.getDay(); // 0 Sun … 6 Sat
    const sat = new Date(startOfDay);
    sat.setDate(sat.getDate() + ((6 - day + 7) % 7));
    const mon = new Date(sat);
    mon.setDate(mon.getDate() + 2);
    const from = day === 0 ? now : new Date(Math.max(sat.getTime() - offsetMs, now.getTime()));
    return { from: from.toISOString(), to: toUtcIso(mon) };
  }
  if (when === "week") {
    const end = new Date(startOfDay);
    end.setDate(end.getDate() + 7);
    return { from: now.toISOString(), to: toUtcIso(end) };
  }
  return { from: now.toISOString(), to: null };
}

export function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
