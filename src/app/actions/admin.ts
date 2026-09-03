"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new Error("Admins only");
  return createAdminClient();
}

export async function setProfessionalStatus(id: string, status: "approved" | "rejected" | "pending", note?: string) {
  const db = await requireAdmin();
  const { error } = await db
    .from("professionals")
    .update({ status, admin_note: note ?? null, ...(status === "approved" ? { badge: "verified" } : {}) })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setProfessionalBadge(id: string, badge: "verified" | "expert" | "parent_favourite" | null) {
  const db = await requireAdmin();
  const { error } = await db.from("professionals").update({ badge }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setEventStatusAdmin(id: string, status: "published" | "pending" | "cancelled" | "draft", note?: string) {
  const db = await requireAdmin();
  const { error } = await db.from("events").update({ status, admin_note: note ?? null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath(`/events/${id}`);
  return { ok: true };
}

export async function setEventFeatured(id: string, featured: boolean) {
  const db = await requireAdmin();
  const { error } = await db.from("events").update({ is_featured: featured }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function getCredentialsLink(path: string) {
  const db = await requireAdmin();
  const { data, error } = await db.storage.from("credentials").createSignedUrl(path, 600);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function setCityActive(id: number, active: boolean) {
  const db = await requireAdmin();
  const { error } = await db.from("cities").update({ is_active: active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
