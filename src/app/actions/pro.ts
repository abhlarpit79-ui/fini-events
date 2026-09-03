"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AGE_BANDS, CATEGORIES, EVENT_MODES } from "@/lib/constants";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => s(fd, k) || null;

export async function saveProfessionalProfile(fd: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const row = {
    display_name: s(fd, "display_name"),
    category: s(fd, "category"),
    bio: opt(fd, "bio"),
    city_id: Number(fd.get("city_id")) || null,
    area: opt(fd, "area"),
    phone: opt(fd, "phone"),
    whatsapp: opt(fd, "whatsapp"),
    website: opt(fd, "website"),
    instagram: opt(fd, "instagram"),
  };
  if (row.display_name.length < 2) return { error: "Name is required." };
  const credentials_url = opt(fd, "credentials_url");

  const { data: existing } = await supabase.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("professionals").update({ ...row, ...(credentials_url ? { credentials_url } : {}) }).eq("id", existing.id)
    : await supabase.from("professionals").insert({ ...row, user_id: user.id, credentials_url });
  if (error) return { error: error.message };
  revalidatePath("/pro");
  return { ok: true };
}

export async function saveEvent(eventId: string | null, fd: FormData) {
  const supabase = await createClient();
  const { data: pro } = await supabase.from("professionals").select("id,status,city_id").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle();
  if (!pro) return { error: "Complete your professional profile first." };
  if (pro.status !== "approved") return { error: "Your profile is awaiting verification. You can create events once approved." };

  const age_bands = fd.getAll("age_bands").map(String).filter((b) => AGE_BANDS.some((a) => a.value === b));
  const mode = s(fd, "mode");
  const starts = s(fd, "starts_at");
  const ends = s(fd, "ends_at");
  const capacityRaw = s(fd, "capacity");
  const feeRaw = s(fd, "fee");

  const row = {
    professional_id: pro.id,
    title: s(fd, "title"),
    description: s(fd, "description"),
    category: s(fd, "category"),
    age_bands,
    starts_at: starts ? new Date(starts + "+05:30").toISOString() : null,
    ends_at: ends ? new Date(ends + "+05:30").toISOString() : null,
    mode,
    venue_name: mode === "venue" ? opt(fd, "venue_name") : null,
    address: mode === "venue" ? opt(fd, "address") : null,
    area: mode === "venue" ? opt(fd, "area") : null,
    map_url: mode === "venue" ? opt(fd, "map_url") : null,
    online_link: mode === "online" ? opt(fd, "online_link") : null,
    city_id: Number(fd.get("city_id")) || pro.city_id,
    capacity: capacityRaw ? Number(capacityRaw) : null,
    fee: feeRaw ? Number(feeRaw) : 0,
    fee_note: opt(fd, "fee_note"),
    what_to_bring: opt(fd, "what_to_bring"),
    image_url: opt(fd, "image_url"),
    status: fd.get("save_as") === "draft" ? "draft" : "pending",
  };

  if (row.title.length < 4) return { error: "Title is too short." };
  if (row.description.length < 20) return { error: "Please describe the event in a few sentences." };
  if (!CATEGORIES.some((c) => c.value === row.category)) return { error: "Choose a category." };
  if (!age_bands.length) return { error: "Select at least one age band." };
  if (!row.starts_at) return { error: "Start date & time is required." };
  if (!EVENT_MODES.some((m) => m.value === mode)) return { error: "Choose venue or online." };
  if (mode === "venue" && !row.venue_name) return { error: "Venue name is required." };
  if (row.capacity != null && (!Number.isInteger(row.capacity) || row.capacity < 1)) return { error: "Capacity must be a whole number." };
  if (row.fee < 0) return { error: "Fee cannot be negative." };

  let id = eventId;
  if (eventId) {
    // Editing a published event keeps it published; other edits go back to review.
    const { data: cur } = await supabase.from("events").select("status").eq("id", eventId).single();
    const status = cur?.status === "published" && row.status === "pending" ? "published" : row.status;
    const { error } = await supabase.from("events").update({ ...row, status }).eq("id", eventId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from("events").insert(row).select("id").single();
    if (error) return { error: error.message };
    id = data.id;
  }
  revalidatePath("/pro");
  revalidatePath("/");
  redirect(`/pro/events/${id}/registrations?saved=1`);
}

export async function setEventStatus(eventId: string, status: "cancelled" | "pending" | "draft") {
  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ status }).eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/pro");
  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
  return { ok: true };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/pro");
  redirect("/pro");
}

export async function setAttendance(regId: string, status: "attended" | "no_show" | "registered") {
  const supabase = await createClient();
  const { error } = await supabase.from("registrations").update({ status }).eq("id", regId);
  if (error) return { error: error.message };
  revalidatePath("/pro", "layout");
  return { ok: true };
}
