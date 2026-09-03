"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAttendance } from "@/app/actions/pro";

export function AttendanceButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (s: "attended" | "no_show" | "registered") => start(async () => { await setAttendance(id, s); router.refresh(); });
  return (
    <div className="flex gap-1">
      <button disabled={pending} onClick={() => set("attended")} className={`chip !py-0.5 ${status === "attended" ? "bg-green-600 text-white border-green-600" : ""}`}>Attended</button>
      <button disabled={pending} onClick={() => set("no_show")} className={`chip !py-0.5 ${status === "no_show" ? "bg-gray-600 text-white border-gray-600" : ""}`}>No-show</button>
      {status !== "registered" && <button disabled={pending} onClick={() => set("registered")} className="chip !py-0.5">↺</button>}
    </div>
  );
}
