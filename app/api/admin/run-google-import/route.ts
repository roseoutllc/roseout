async function importRestaurant(place: any) {
  const { data: existing } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("google_place_id", place.place_id)
    .maybeSingle();

  if (existing) return { imported: false, skipped: true };

  const claimQr = await createClaimQr("restaurant");
  const scores = calculateImportScores(place);

  const addressParts = parseAddressParts(
    place.formatted_address || place.vicinity || null
  );

  const primaryTag = getPrimaryTag(place, "restaurant");

  const { error } = await supabaseAdmin.from("restaurants").insert({
    restaurant_name: place.name,
    address: addressParts.fullAddress,
    city: addressParts.city,
    state: addressParts.state,
    zip_code: addressParts.zipCode,

    // ✅ FIXED: clean cuisine instead of Google junk types
    cuisine: primaryTag || "restaurant",

    rating: place.rating || 0,
    review_count: getReviewCount(place),
    google_place_id: place.place_id,
    image_url: googlePhotoUrl(place),
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,

    status: "approved",
    claimed: false,

    view_count: 0,
    click_count: 0,
    claim_count: 0,

    primary_tag: primaryTag,
    search_keywords: buildSearchKeywords(place, "restaurant"),

    ...scores,
    ...claimQr,
  });

  if (error) throw new Error(error.message);

  return { imported: true, skipped: false };
}