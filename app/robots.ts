import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.com").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/owner/",
          "/dashboard/",
          "/user/",
          "/reserve/dashboard/",
          "/reserve/portal/",
          "/api/",
          "/login",
          "/signup",
          "/reset-password",
          "/forgot-password",
          "/verify",
          "/checkout",
          "/claim/",
          "/claim-activity/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}