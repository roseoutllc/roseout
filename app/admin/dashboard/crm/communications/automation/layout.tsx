import type { ReactNode } from "react";
import { requireAdminRole } from "@/lib/admin-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";

export default async function CrmAutomationAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminRole(ADMIN_PAGE_ACCESS.communicationSend);
  return children;
}
