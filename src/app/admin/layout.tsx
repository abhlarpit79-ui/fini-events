import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { profile } = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/pro/login?next=/admin");
  const tabs = [
    ["/admin", "Overview"],
    ["/admin/professionals", "Professionals"],
    ["/admin/events", "Events"],
    ["/admin/broadcast", "WhatsApp broadcast"],
    ["/admin/cities", "Cities"],
  ];
  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className="chip whitespace-nowrap hover:bg-orange-50">{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
