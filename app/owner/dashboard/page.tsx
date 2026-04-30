import { redirect } from "next/navigation";

export default function OwnerDashboardRedirectPage() {
  redirect("/locations/dashboard");
}