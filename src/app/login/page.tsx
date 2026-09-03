import { OtpLogin } from "@/components/OtpLogin";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/me";
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-1">Log in with your mobile</h1>
      <p className="text-sm text-muted mb-4">We&apos;ll send a one-time code. No password needed.</p>
      <OtpLogin next={next} />
      <p className="text-xs text-muted mt-4 text-center">
        Are you a professional? <a href="/pro/login" className="underline">Log in here</a>
      </p>
    </div>
  );
}
