"use client"

import { requireAdminRole } from "@/lib/admin-auth";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  await requireAdminRole(["superuser"]);

  return <AdminUsersClient />;
}