import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME } from "@/lib/constants";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${SITE_NAME} – events for parents of 0–3 year olds`,
  description:
    "Discover workshops, classes and experiences for your baby or toddler, hosted by verified professionals in your city.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = data?.role ?? null;
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav user={user ? { id: user.id, role } : null} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          <p>
            {SITE_NAME} is a free listing platform. Events are organised and run by
            the listed professionals; fees, if any, are paid to them directly.
          </p>
          <p className="mt-1">
            <a href="/terms" className="underline">Terms</a> ·{" "}
            <a href="/privacy" className="underline">Privacy</a> ·{" "}
            <a href="/pro/signup" className="underline">List your event</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
