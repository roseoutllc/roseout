import type { Metadata } from "next";
import "./globals.css";
import RoseOutHeader from "@/components/RoseOutHeader";
import RoseOutFooter from "@/components/RoseOutFooter";

export const metadata: Metadata = {
  title: "RoseOut",
  description:
    "AI-powered outing planner for restaurants, activities, and unforgettable outings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {/* GLOBAL HEADER */}
        <RoseOutHeader />

        {/* PAGE CONTENT */}
        <main className="min-h-screen">{children}</main>

        {/* GLOBAL FOOTER */}
        <RoseOutFooter />
      </body>
    </html>
  );
}