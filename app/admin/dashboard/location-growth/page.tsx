import { redirect } from "next/navigation";

export default function LocationGrowthRedirectPage() {
  redirect("/admin/dashboard/settings/location-tools/import?tab=nyc");
}
