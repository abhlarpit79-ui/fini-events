import { createAdminClient } from "@/lib/supabase/server";
import { CityToggle } from "@/components/admin/CityToggle";

export default async function CitiesPage() {
  const db = createAdminClient();
  const { data: cities } = await db.from("cities").select("*").order("name");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Cities</h1>
      <p className="text-sm text-muted">Tech is pan-India; switch a city on only when you have a curated set of professionals there.</p>
      <div className="card divide-y divide-border">
        {(cities ?? []).map((c) => (
          <div key={c.id} className="p-3 flex items-center justify-between">
            <span className="font-medium">{c.name}</span>
            <CityToggle id={c.id} active={c.is_active} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">To add a city, insert a row in the <code>cities</code> table (name, slug).</p>
    </div>
  );
}
