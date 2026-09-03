"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCityActive } from "@/app/actions/admin";

export function CityToggle({ id, active }: { id: number; active: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      className={`chip ${active ? "chip-active" : ""}`}
      onClick={() => start(async () => { await setCityActive(id, !active); router.refresh(); })}
    >
      {active ? "Live" : "Off"}
    </button>
  );
}
