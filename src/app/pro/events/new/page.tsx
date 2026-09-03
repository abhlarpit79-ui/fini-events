import { redirect } from "next/navigation";
import { getCities, getMyProfessional } from "@/lib/queries";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const [pro, cities] = await Promise.all([getMyProfessional(), getCities()]);
  if (!pro || pro.status !== "approved") redirect("/pro");
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Create an event</h1>
      <EventForm cities={cities.filter((c) => c.is_active)} existing={null} defaultCity={pro.city_id} />
    </div>
  );
}
