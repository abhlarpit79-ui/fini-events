import { getCities } from "@/lib/queries";
import { ProSignup } from "@/components/ProSignup";

export default async function ProSignupPage() {
  const cities = await getCities();
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold">List your events – free</h1>
        <p className="text-sm text-muted">
          For pediatricians, therapists, educators, coaches, play spaces and baby brands. Every profile is verified by our team before events go live.
        </p>
      </div>
      <ProSignup cities={cities.filter((c) => c.is_active)} />
    </div>
  );
}
