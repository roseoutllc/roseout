import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReserveBookingForm from "@/components/ReserveBookingForm";

export default async function ReserveLocationPage({
  params,
}: {
  params: Promise<{ locationType: string; id: string }>;
}) {
  const { locationType, id } = await params;

  const tableName = locationType === "activity" ? "activities" : "restaurants";

  const nameField =
    locationType === "activity" ? "activity_name" : "restaurant_name";

  const { data: location } = await supabase
    .from(tableName)
    .select(
      `id, ${nameField}, city, state, image_url, default_duration_minutes`
    )
    .eq("id", id)
    .single();

  if (!location) notFound();

  const locationName =
    locationType === "activity"
      ? location.activity_name
      : location.restaurant_name;

  return (
    <main className="min-h-screen bg-[#090706] px-4 pb-10 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/locations/${locationType === "activity" ? "activities" : "restaurants"}/${id}`}
          className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white/60 hover:text-white"
        >
          ← Back to location
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#120d0b] shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-[1fr_430px]">
            <div className="relative min-h-[320px] bg-black">
              {location.image_url ? (
                <img
                  src={location.image_url}
                  alt={locationName || "Location"}
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center bg-gradient-to-br from-rose-950 to-black text-5xl">
                  🌹
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute bottom-0 left-0 p-6">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                  RoseOut Reserve
                </p>
                <h1 className="text-4xl font-black">{locationName}</h1>
                <p className="mt-2 text-sm font-semibold text-white/65">
                  {location.city || "New York"}, {location.state || "NY"}
                </p>
              </div>
            </div>

            <ReserveBookingForm
              locationId={id}
              locationType={locationType}
              locationName={locationName || "Location"}
              defaultDuration={location.default_duration_minutes || 90}
            />
          </div>
        </section>
      </div>
    </main>
  );
}