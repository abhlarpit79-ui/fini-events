import { createAdminClient } from "@/lib/supabase/server";
import { ProfessionalAdminRow } from "@/components/admin/ProfessionalAdminRow";
import type { Professional } from "@/lib/types";
import Link from "next/link";

export default async function AdminProfessionals({ searchParams }: PageProps<"/admin/professionals">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const db = createAdminClient();
  let q = db.from("professionals").select("*, city:cities(name)").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  // fetch emails for admin context
  const ids = (data ?? []).map((p) => p.user_id);
  const emails = new Map<string, string>();
  if (ids.length) {
    const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
    users?.users.forEach((u) => ids.includes(u.id) && emails.set(u.id, u.email ?? ""));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Professionals</h1>
        <div className="flex gap-1">
          {["", "pending", "approved", "rejected"].map((s) => (
            <Link key={s} href={`/admin/professionals${s ? `?status=${s}` : ""}`} className={`chip ${status === s ? "chip-active" : ""}`}>{s || "all"}</Link>
          ))}
        </div>
      </div>
      {(data ?? []).length === 0 && <div className="card p-8 text-center text-sm text-muted">Nothing here.</div>}
      {(data ?? []).map((p) => (
        <ProfessionalAdminRow key={p.id} p={p as Professional & { city: { name: string } | null }} email={emails.get(p.user_id) ?? ""} />
      ))}
    </div>
  );
}
