"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalisePhone } from "@/lib/utils";
import { AGE_BANDS } from "@/lib/constants";

export async function registerForEvent(eventId: string, fd: FormData) {
  const supabase = await createClient();
  const name = String(fd.get("parent_name") ?? "").trim();
  const phone = normalisePhone(String(fd.get("phone") ?? ""));
  const band = String(fd.get("child_age_band") ?? "");
  const optIn = fd.get("opt_in") === "on";

  if (name.length < 2) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid 10-digit Indian mobile number." };
  if (!AGE_BANDS.some((b) => b.value === band)) return { error: "Please choose your child's age." };

  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
    p_parent_name: name,
    p_phone: phone,
    p_child_age_band: band,
    p_opt_in: optIn,
  });
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/me");
  return { status: data as string };
}

export async function cancelRegistration(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };
  const { error } = await supabase
    .from("registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/me");
  return { ok: true };
}

export async function leaveFeedback(eventId: string, rating: number, comment: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };
  const { error } = await supabase
    .from("feedback")
    .upsert({ event_id: eventId, user_id: user.id, rating, comment: comment || null }, { onConflict: "event_id,user_id" });
  if (error) return { error: error.message };
  revalidatePath("/me");
  return { ok: true };
}
