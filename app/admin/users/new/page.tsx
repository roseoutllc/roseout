import { redirect } from "next/navigation";

export default function LegacyNewAdminUserPage() {
  redirect("/admin/dashboard/users/new");
}
