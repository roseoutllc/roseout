"use client";

import { usePathname } from "next/navigation";
import RoseOutHeader from "@/components/RoseOutHeader";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideGlobalHeader =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/restaurants/dashboard") ||
    pathname?.startsWith("/locations/dashboard") ||
    pathname?.startsWith("/reserve/dashboard") ||
    pathname?.startsWith("/reserve/portal");

  return (
    <>
      {!hideGlobalHeader && <RoseOutHeader />}
      {children}
    </>
  );
}