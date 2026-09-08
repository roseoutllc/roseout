import WorkspaceHub from "../_components/WorkspaceHub";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BusinessSetupHubPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  return (
    <WorkspaceHub
      eyebrow="Business setup"
      title="Business setup"
      description="Manage the lower-frequency setup tools for how your location looks, connects, and gets discovered."
      searchParams={params}
      items={[
        { title: "Branding", description: "Manage brand presentation, logo, imagery, and visual identity.", href: "/locations/dashboard/branding" },
        { title: "Domain", description: "Connect and manage your business website domain.", href: "/locations/dashboard/domains" },
        { title: "QR Codes", description: "Create and manage QR codes for menus, offers, reservations, events, and reviews.", href: "/locations/dashboard/qr-codes" },
      ]}
    />
  );
}
