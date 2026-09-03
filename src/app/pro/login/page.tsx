import { EmailLogin } from "@/components/EmailLogin";

export default async function ProLoginPage({ searchParams }: PageProps<"/pro/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/pro";
  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-1">Professional / admin login</h1>
      <p className="text-sm text-muted mb-4">Parents log in with mobile OTP <a href="/login" className="underline">here</a>.</p>
      <EmailLogin next={next} />
      <p className="text-xs text-muted mt-4 text-center">New here? <a href="/pro/signup" className="underline">Create a professional account</a></p>
    </div>
  );
}
