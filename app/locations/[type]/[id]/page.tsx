import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import LocationDetailClient from "./LocationDetailClient";
import { absoluteUrl, createPageMetadata, safeJsonLd } from "@/lib/seo";

type LocationRecord = {
  id?: string;
  restaurant_name?: string | null;
  activity_name?: string | null;
  name?: string | null;
  location_type?: string | null;
  activity_type?: string | null;
  cuisine?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  zip_code?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  rating?: number | null;
  review_score?: number | null;
  roseout_score?: number | null;
  quality_score?: number | null;
  review_count?: number | null;
  price_range?: string | null;
};

type LocationPageProps = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

async function getLocation(
  type: string,
  id: string
): Promise<LocationRecord | null> {
  const supabase = adminSupabase();

  let { data } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .maybeSingle<LocationRecord>();

  if (!data && (type === "restaurants" || type === "restaurant")) {
    const fallback = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .maybeSingle<LocationRecord>();

    data = fallback.data
      ? {
          ...fallback.data,
          location_type: "restaurant",
          name: fallback.data.restaurant_name,
        }
      : null;
  }

  if (!data && (type === "activities" || type === "activity")) {
    const fallback = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .maybeSingle<LocationRecord>();

    data = fallback.data
      ? {
          ...fallback.data,
          location_type: "activity",
          name: fallback.data.activity_name,
        }
      : null;
  }

  return data;
}

function getLocationName(location?: LocationRecord | null) {
  return (
    location?.restaurant_name ||
    location?.activity_name ||
    location?.name ||
    "RoseOut Location"
  );
}

function getLocationDescription(location: LocationRecord, isActivity: boolean) {
  const cityState = [location?.city, location?.state].filter(Boolean).join(", ");
  const category = isActivity
    ? location?.activity_type || "activity"
    : location?.cuisine || "restaurant";
  const score = Math.round(
    location.review_score ||
      location.roseout_score ||
      location.quality_score ||
      0
  );
  const scoreText = score > 0 ? ` RoseOut score: ${score}.` : "";

  return `Explore ${getLocationName(location)}, a ${category} ${
    cityState ? `in ${cityState}` : "on RoseOut"
  }. See ranking signals, reviews, reservation links, directions, and outing-fit details.${scoreText}`;
}

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { type, id } = await params;
  const location = await getLocation(type, id);

  if (!location) {
    return createPageMetadata({
      title: "Location Not Found | RoseOut",
      description: "This RoseOut location could not be found.",
      path: `/locations/${type}/${id}`,
      noIndex: true,
    });
  }

  const isActivity =
    location.location_type === "activity" ||
    type === "activities" ||
    type === "activity";
  const name = getLocationName(location);
  const category = isActivity
    ? location.activity_type || "Activity"
    : location.cuisine || "Restaurant";
  const image = location.image_url || location.photo_url || "/opengraph-image";

  return createPageMetadata({
    title: `${name} | ${category} on RoseOut`,
    description: getLocationDescription(location, isActivity),
    path: `/locations/${type}/${id}`,
    keywords: [name, category, location.city, location.state].filter(
      (keyword): keyword is string => Boolean(keyword)
    ),
    image,
  });
}

export default async function LocationDetailPage({ params }: LocationPageProps) {
  const { type, id } = await params;
  const location = await getLocation(type, id);

  const isActivity =
    location?.location_type === "activity" ||
    type === "activities" ||
    type === "activity";
  const name = getLocationName(location);
  const address = [
    location?.address,
    location?.city,
    location?.state,
    location?.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
  const image = location?.image_url || location?.photo_url;
  const rating = location?.rating || location?.review_score;

  const jsonLd = location
    ? {
        "@context": "https://schema.org",
        "@type": isActivity ? "LocalBusiness" : "Restaurant",
        "@id": absoluteUrl(`/locations/${type}/${id}#location`),
        name,
        description: getLocationDescription(location, isActivity),
        image: image ? [image] : undefined,
        address: address
          ? {
              "@type": "PostalAddress",
              streetAddress: location.address,
              addressLocality: location.city,
              addressRegion: location.state,
              postalCode: location.zip_code,
              addressCountry: "US",
            }
          : undefined,
        aggregateRating: rating
          ? {
              "@type": "AggregateRating",
              ratingValue: rating,
              reviewCount: location.review_count || 1,
            }
          : undefined,
        url: absoluteUrl(`/locations/${type}/${id}`),
        servesCuisine: location.cuisine,
        priceRange: location.price_range,
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      ) : null}
      <LocationDetailClient />
    </>
  );
}
