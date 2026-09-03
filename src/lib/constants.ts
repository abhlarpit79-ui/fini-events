export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "FINI Events";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const PLATFORM_WHATSAPP =
  process.env.NEXT_PUBLIC_PLATFORM_WHATSAPP ?? "";

export const AGE_BANDS = [
  { value: "0-3m", label: "0–3 months" },
  { value: "3-6m", label: "3–6 months" },
  { value: "6-12m", label: "6–12 months" },
  { value: "1-2y", label: "1–2 years" },
  { value: "2-3y", label: "2–3 years" },
  { value: "expecting", label: "Expecting parents" },
] as const;
export type AgeBand = (typeof AGE_BANDS)[number]["value"];

export const CATEGORIES = [
  { value: "health", label: "Health & Development", emoji: "🩺" },
  { value: "feeding", label: "Feeding & Nutrition", emoji: "🥣" },
  { value: "sleep", label: "Sleep & Routine", emoji: "😴" },
  { value: "play", label: "Play & Learning", emoji: "🧸" },
  { value: "childcare", label: "Childcare", emoji: "👩‍👦" },
  { value: "parent", label: "Parent Support", emoji: "❤️" },
  { value: "activity", label: "Activities & Experiences", emoji: "🎵" },
  { value: "places", label: "Baby-Friendly Places", emoji: "🏡" },
  { value: "products", label: "Products & Brands", emoji: "🛍️" },
] as const;
export type Category = (typeof CATEGORIES)[number]["value"];

export const PRO_CATEGORIES = [
  "Pediatrician",
  "Lactation consultant",
  "Pediatric nutritionist",
  "Sleep consultant",
  "Developmental therapist",
  "Physiotherapist",
  "Occupational therapist",
  "Speech therapist",
  "Child psychologist",
  "Early-childhood educator",
  "Montessori educator",
  "Music & movement educator",
  "Baby yoga / swimming instructor",
  "Sensory-play facilitator",
  "Parenting coach",
  "Postpartum doula",
  "Newborn-care specialist",
  "Photographer",
  "Play space / activity centre",
  "Daycare / preschool",
  "Brand / store",
  "Other",
] as const;

export const EVENT_MODES = [
  { value: "venue", label: "At a venue" },
  { value: "online", label: "Online" },
] as const;

export const WHATSAPP_OPT_IN_TEXT =
  "Send me event confirmations, reminders and weekly picks on WhatsApp. You can opt out any time.";

export function ageBandLabel(v: string) {
  return AGE_BANDS.find((a) => a.value === v)?.label ?? v;
}
export function categoryMeta(v: string) {
  return CATEGORIES.find((c) => c.value === v) ?? { value: v, label: v, emoji: "📌" };
}
