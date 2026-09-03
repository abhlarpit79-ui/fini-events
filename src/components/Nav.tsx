import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { SignOutButton } from "./SignOutButton";

export function Nav({ user }: { user: { id: string; role: string | null } | null }) {
  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="text-brand">●</span> {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {!user && (
            <>
              <Link href="/pro/signup" className="hidden sm:inline text-muted hover:text-foreground px-2">
                For professionals
              </Link>
              <Link href="/login" className="btn-secondary !py-1.5">
                Log in
              </Link>
            </>
          )}
          {user && user.role === "parent" && (
            <Link href="/me" className="btn-secondary !py-1.5">My events</Link>
          )}
          {user && user.role === "professional" && (
            <Link href="/pro" className="btn-secondary !py-1.5">Dashboard</Link>
          )}
          {user && user.role === "admin" && (
            <>
              <Link href="/pro" className="text-muted hover:text-foreground px-2 hidden sm:inline">Pro</Link>
              <Link href="/admin" className="btn-secondary !py-1.5">Admin</Link>
            </>
          )}
          {user && <SignOutButton />}
        </nav>
      </div>
    </header>
  );
}
