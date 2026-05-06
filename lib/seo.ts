import type { Metadata } from "next";

export const siteName = "RoseOut";
export const defaultTitle = "RoseOut | AI Outing Planner for Restaurants, Activities & Date Nights";
export const defaultDescription =
  "Plan better nights out with RoseOut. Discover AI-ranked restaurants, activities, date-night ideas, reservations, and curated outing plans tailored to your vibe, budget, and location.";
export const defaultKeywords = [
  "outing planner",
  "AI outing planner",
  "date night ideas",
  "restaurant recommendations",
  "activity recommendations",
  "NYC restaurants",
  "things to do near me",
  "RoseOut rankings",
  "reservation planner",
  "night out planner",
];

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://roseout.com"
  ).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;

  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function createPageMetadata({
  title,
  description = defaultDescription,
  path = "/",
  keywords = [],
  image = "/opengraph-image",
  noIndex = false,
  type = "website",
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: getSiteUrl(),
  logo: absoluteUrl("/icon"),
  sameAs: [],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: getSiteUrl(),
  description: defaultDescription,
  potentialAction: {
    "@type": "SearchAction",
    target: `${absoluteUrl("/create")}?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};
