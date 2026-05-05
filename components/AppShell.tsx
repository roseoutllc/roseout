"use client";

import { usePathname } from "next/navigation";
import RoseOutHeader from "@/components/RoseOutHeader";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/reserve/dashboard");

  return (
    <>
      {!isAdmin && <RoseOutHeader />}
      {children}
    </>
  );
}