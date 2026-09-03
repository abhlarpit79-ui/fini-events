import { getCities, getMyProfessional } from "@/lib/queries";
import { ProProfileForm } from "@/components/ProProfileForm";

export const dynamic = "force-dynamic";

export default async function ProProfilePage() {
  const [pro, cities] = await Promise.all([getMyProfessional(), getCities()]);
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Your profile</h1>
      <ProProfileForm cities={cities.filter((c) => c.is_active)} existing={pro} />
    </div>
  );
}
