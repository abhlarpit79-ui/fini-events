import { createClient } from "@/lib/supabase/server";
import type { City, EventWithPro } from "@/lib/types";
import { windowFor } from "./utils";

const EVENT_SELECT =
  "*, professional:professionals(id,display_name,category,badge,whatsapp,area), city:cities(id,name)";

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cities").select("*").order("name");
  return data ?? [];
}

export async function attachCounts<T extends { id: string }>(events: T[]) {
  if (!events.length) return events as (T & { registered_count: number })[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_counts")
    .select("event_id, registered_count, waitlisted_count")
    .in("event_id", events.map((e) => e.id));
  const map = new Map((data ?? []).map((r) => [r.event_id, Number(r.registered_count)]));
  return events.map((e) => ({ ...e, registered_count: map.get(e.id) ?? 0 }));
}

export interface FeedFilters {
  city?: string;
  age?: string;
  cat?: string;
  when?: string;
  q?: string;
}

export async function getFeed(f: FeedFilters): Promise<EventWithPro[]> {
  const supabase = await createClient();
  const { from, to } = windowFor(f.when);
  let q = supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .gte("starts_at", from)
    .order("is_featured", { ascending: false })
    .order("starts_at", { ascending: true })
    .limit(60);
  if (to) q = q.lt("starts_at", to);
  if (f.city) q = q.eq("city_id", Number(f.city));
  if (f.age) q = q.contains("age_bands", [f.age]);
  if (f.cat) q = q.eq("category", f.cat);
  if (f.q) q = q.ilike("title", `%${f.q}%`);
  const { data } = await q;
  return attachCounts((data ?? []) as unknown as EventWithPro[]);
}

export async function getEvent(id: string): Promise<EventWithPro | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(EVENT_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const [e] = await attachCounts([data as unknown as EventWithPro]);
  return e;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile };
}

export async function getMyProfessional() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("professionals").select("*").eq("user_id", user.id).maybeSingle();
  return data;
}
