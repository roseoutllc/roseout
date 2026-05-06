import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function buildRedirectUrl(searchParams: SearchParams) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return `/admin/dashboard/users${query ? `?${query}` : ""}`;
}

export default async function LegacyAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(buildRedirectUrl(await searchParams));
}
