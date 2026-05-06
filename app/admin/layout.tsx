import type { Metadata } from "next";
import AdminTopBar from "./components/AdminTopBar";

export const metadata: Metadata = {
  title: "RoseOut Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090706] text-white">
      <AdminTopBar />
      {children}
    </div>
  );
}