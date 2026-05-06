import { redirect } from "next/navigation";

export default function LegacyAdminClaimsPage() {
  redirect("/admin/dashboard/claims");
}
