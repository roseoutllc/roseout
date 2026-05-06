import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyAdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  redirect(`/admin/dashboard/users/${id}`);
}
