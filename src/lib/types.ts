export type Role = "parent" | "professional" | "admin";

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  city_id: number | null;
  whatsapp_opt_in: boolean;
  created_at: string;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export type ProStatus = "pending" | "approved" | "rejected";
export type ProBadge = "verified" | "expert" | "parent_favourite" | null;

export interface Professional {
  id: string;
  user_id: string;
  display_name: string;
  category: string;
  bio: string | null;
  city_id: number | null;
  area: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  credentials_url: string | null;
  status: ProStatus;
  badge: ProBadge;
  admin_note: string | null;
  created_at: string;
}

export type EventStatus = "draft" | "pending" | "published" | "cancelled";

export interface Event {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  age_bands: string[];
  starts_at: string;
  ends_at: string | null;
  mode: "venue" | "online";
  venue_name: string | null;
  address: string | null;
  area: string | null;
  city_id: number;
  map_url: string | null;
  online_link: string | null;
  capacity: number | null;
  fee: number;
  fee_note: string | null;
  what_to_bring: string | null;
  image_url: string | null;
  status: EventStatus;
  is_featured: boolean;
  admin_note: string | null;
  created_at: string;
}

export type RegStatus =
  | "registered"
  | "waitlisted"
  | "cancelled"
  | "attended"
  | "no_show";

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  parent_name: string;
  phone: string;
  child_age_band: string;
  status: RegStatus;
  whatsapp_opt_in: boolean;
  created_at: string;
}

export interface EventWithPro extends Event {
  professional: Pick<
    Professional,
    "id" | "display_name" | "category" | "badge" | "whatsapp" | "area"
  >;
  city: Pick<City, "id" | "name">;
  registered_count?: number;
}
