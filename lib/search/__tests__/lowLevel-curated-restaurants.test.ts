import { describe, expect, it } from "vitest";
import { isLowLevelLocation } from "@/lib/search/lowLevel";

const curatedRestaurant = {
  location_type: "restaurant",
  rating: 4.7,
  review_count: 300,
  has_photos: true,
  photo_status: "storage_cached",
  main_image: "https://example.supabase.co/storage/v1/object/public/location-images/example.jpg",
  curation_tier: "curated",
  public_visibility_tier: "standard",
  source_quality_status: "curated_google",
  import_confidence: "high",
  tags: ["restaurant", "dine in", "takeout", "delivery"],
  search_keywords: ["restaurant", "dine in", "takeout", "delivery"],
};

describe("low-level classification for curated restaurants", () => {
  it("does not hide a strong dine-in restaurant merely because it offers takeout", () => {
    expect(isLowLevelLocation(curatedRestaurant)).toBe(false);
  });

  it("still hides a deli even when it is otherwise curated and offers dine-in", () => {
    expect(
      isLowLevelLocation({
        ...curatedRestaurant,
        name: "Neighborhood Deli",
        tags: [...curatedRestaurant.tags, "deli"],
      }),
    ).toBe(true);
  });

  it("still respects explicit low-level flags", () => {
    expect(isLowLevelLocation({ ...curatedRestaurant, is_low_level: true })).toBe(true);
  });

  it("hides takeout-first restaurants when Google explicitly says there is no dine-in", () => {
    expect(
      isLowLevelLocation({
        location_type: "restaurant",
        name: "Island Jerk Kitchen",
        rating: 4.6,
        review_count: 800,
        has_photos: true,
        photo_status: "storage_cached",
        main_image: "https://example.com/storefront.jpg",
        google_types: ["restaurant", "meal_takeaway", "food"],
        dine_in: false,
        takeout: true,
        delivery: true,
      }),
    ).toBe(true);
  });

  it("hides takeaway-oriented Google types without destination evidence", () => {
    expect(
      isLowLevelLocation({
        location_type: "restaurant",
        name: "Local Slice Shop",
        rating: 4.7,
        review_count: 900,
        has_photos: true,
        photo_status: "storage_cached",
        main_image: "https://example.com/slice.jpg",
        google_types: ["pizza_restaurant", "meal_takeaway", "restaurant"],
      }),
    ).toBe(true);
  });

  it("does not hide full-service restaurants that also expose takeaway types", () => {
    expect(
      isLowLevelLocation({
        location_type: "restaurant",
        name: "Harbor House",
        rating: 4.7,
        review_count: 900,
        has_photos: true,
        photo_status: "storage_cached",
        main_image: "https://example.com/harbor.jpg",
        google_types: ["seafood_restaurant", "meal_takeaway", "restaurant"],
        tags: ["dine in", "waterfront", "cocktails"],
      }),
    ).toBe(false);
  });

  it("catches weak generic restaurants with no outing evidence", () => {
    expect(
      isLowLevelLocation({
        location_type: "restaurant",
        name: "Yardies Jerk - Saint Albans",
        rating: 4.0,
        review_count: 1095,
        has_photos: true,
        photo_status: "storage_cached",
        main_image: "https://example.com/yardies.jpg",
        google_primary_type: "restaurant",
        google_types: ["restaurant", "food", "point_of_interest", "establishment"],
        tags: ["caribbean"],
      }),
    ).toBe(true);
  });

  it("keeps a generic restaurant above the discovery floor when it has dine-in evidence", () => {
    expect(
      isLowLevelLocation({
        location_type: "restaurant",
        name: "Neighborhood Dining Room",
        rating: 4.3,
        review_count: 120,
        has_photos: true,
        photo_status: "storage_cached",
        main_image: "https://example.com/dining-room.jpg",
        google_types: ["restaurant", "food"],
        tags: ["dine in"],
      }),
    ).toBe(false);
  });
});
