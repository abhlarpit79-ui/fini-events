import { notFound, redirect } from "next/navigation";
import { getCities, getMyProfessional } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: PageProps<"/pro/events/[id]/edit">) {
  const { id } = await params;
  const [pro, cities] = await Promise.all([getMyProfessional(), getCities()]);
  if (!pro) redirect("/pro");
  const supabase = await createClient();
  const { data: e } = await supabase.from("events").select("*").eq("id", id).eq("professional_id", pro.id).maybeSingle();
  if (!e) notFound();
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Edit event</h1>
      <EventForm cities={cities} existing={e} defaultCity={pro.city_id} />
    </div>
  );
}
