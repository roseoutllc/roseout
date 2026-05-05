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
    pathname?.startsWith("/reserve/dashboard") ||
    pathname?.startsWith("/restaurants/dashboard") ||
    pathname?.startsWith("/locations/dashboard");

  return (
    <>
      {!hideGlobalHeader && <RoseOutHeader />}
      {children}
    </>
  );
}