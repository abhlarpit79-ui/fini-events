"use client";

import { useRouter, usePathname } from "next/navigation";
import type { City } from "@/lib/types";

type Opt = { readonly value: string; readonly label: string; readonly emoji?: string };

export function FeedFilters({
  cities,
  ageBands,
  categories,
  current,
}: {
  cities: City[];
  ageBands: readonly Opt[];
  categories: readonly Opt[];
  current: { city?: string; age?: string; cat?: string; when?: string; q?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  function set(k: string, v: string | undefined) {
    const p = new URLSearchParams();
    const next = { ...current, [k]: v };
    Object.entries(next).forEach(([key, val]) => val && p.set(key, val));
    router.push(`${pathname}?${p.toString()}`);
  }

  const whenOpts = [
    { value: "", label: "Upcoming" },
    { value: "today", label: "Today" },
    { value: "weekend", label: "This weekend" },
    { value: "week", label: "Next 7 days" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <select className="input sm:w-48" value={current.city ?? ""} onChange={(e) => set("city", e.target.value || undefined)}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="input sm:w-48" value={current.age ?? ""} onChange={(e) => set("age", e.target.value || undefined)}>
          <option value="">Any age</option>
          {ageBands.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <input
          className="input flex-1"
          placeholder="Search events…"
          defaultValue={current.q ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value || undefined);
          }}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {whenOpts.map((w) => (
          <button
            key={w.value}
            className={`chip whitespace-nowrap ${(current.when ?? "") === w.value ? "chip-active" : ""}`}
            onClick={() => set("when", w.value || undefined)}
          >
            {w.label}
          </button>
        ))}
        <span className="border-l border-border mx-1" />
        <button className={`chip whitespace-nowrap ${!current.cat ? "chip-active" : ""}`} onClick={() => set("cat", undefined)}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.value}
            className={`chip whitespace-nowrap ${current.cat === c.value ? "chip-active" : ""}`}
            onClick={() => set("cat", c.value)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
