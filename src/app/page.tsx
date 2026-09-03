import { getCities, getFeed } from "@/lib/queries";
import { AGE_BANDS, CATEGORIES } from "@/lib/constants";
import { EventCard } from "@/components/EventCard";
import { FeedFilters } from "@/components/FeedFilters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters = {
    city: pick("city"),
    age: pick("age"),
    cat: pick("cat"),
    when: pick("when"),
    q: pick("q"),
  };
  const [cities, events] = await Promise.all([getCities(), getFeed(filters)]);
  const activeCities = cities.filter((c) => c.is_active);

  return (
    <div className="space-y-6">
      <section className="text-center py-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Things to do with your baby this week
        </h1>
        <p className="text-muted mt-1 text-sm sm:text-base">
          Workshops, classes and experiences for 0–3 year olds, hosted by verified professionals. Free to browse, free to register.
        </p>
      </section>

      <FeedFilters cities={activeCities} ageBands={AGE_BANDS} categories={CATEGORIES} current={filters} />

      {events.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          <div className="text-4xl mb-2">🍼</div>
          No events match yet. Try another filter, or{" "}
          <Link href="/pro/signup" className="underline text-brand">list your own event</Link>.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}

      <section className="card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div>
          <h2 className="font-semibold">Are you a pediatrician, educator, coach or play space?</h2>
          <p className="text-sm text-muted">List your workshops and sessions free. Parents in your city register in one tap.</p>
        </div>
        <Link href="/pro/signup" className="btn-primary whitespace-nowrap">List your event</Link>
      </section>
    </div>
  );
}
