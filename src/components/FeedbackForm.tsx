"use client";

import { useState, useTransition } from "react";
import { leaveFeedback } from "@/app/actions/registration";

export function FeedbackForm({ eventId, existing }: { eventId: string; existing: number | null }) {
  const [rating, setRating] = useState(existing ?? 0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(existing != null);
  const [pending, start] = useTransition();

  if (done) return <span className="text-xs text-muted">Rated {"★".repeat(rating)}</span>;

  return (
    <div className="w-full sm:w-auto flex flex-col gap-1 text-xs">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={`text-lg ${n <= rating ? "text-yellow-500" : "text-gray-300"}`}>★</button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <input className="input !py-1.5" placeholder="Anything to share? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-secondary !py-1.5" disabled={pending} onClick={() => start(async () => { const r = await leaveFeedback(eventId, rating, comment); if (!r.error) setDone(true); })}>
            Submit
          </button>
        </>
      )}
    </div>
  );
}
