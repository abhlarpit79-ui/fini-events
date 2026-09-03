"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEventStatus, deleteEvent } from "@/app/actions/pro";

export function EventStatusActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  if (status === "published" || status === "pending") {
    return (
      <button className="btn-secondary !py-1.5 text-red-700" disabled={pending} onClick={() => run(() => setEventStatus(id, "cancelled"))}>
        Cancel
      </button>
    );
  }
  if (status === "draft") {
    return (
      <>
        <button className="btn-primary !py-1.5" disabled={pending} onClick={() => run(() => setEventStatus(id, "pending"))}>Submit</button>
        <button className="btn-secondary !py-1.5 text-red-700" disabled={pending} onClick={() => run(() => deleteEvent(id))}>Delete</button>
      </>
    );
  }
  return null;
}
