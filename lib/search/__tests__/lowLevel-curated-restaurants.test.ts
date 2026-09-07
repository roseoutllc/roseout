import { describe, expect, it } from "vitest";
import {
  applyLowLevelPenalty,
  isLowLevelLocation,
  isQuickBiteSearchCandidate,
} from "@/lib/search/lowLevel";

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

describe("contextual restaurant suitability", () => {
  it("does not hide a strong dine-in restaurant merely because it offers takeout", () => {
    expect(isLowLevelLocation(curatedRestaurant)).toBe(false);
    expect(isQuickBiteSearchCandidate(curatedRestaurant)).toBe(false);
  });

  it("still respects explicit low-level flags", () => {
    expect(isLowLevelLocation({ ...curatedRestaurant, is_low_level: true })).toBe(true);
  });

  it("classifies takeout-first restaurants as quick-bite candidates without hiding them", () => {
    const item = {
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
    };
    expect(isQuickBiteSearchCandidate(item)).toBe(true);
    expect(isLowLevelLocation(item)).toBe(false);
  });

  it("suppresses quick-bite candidates in a normal dinner search", () => {
    const item = {
      location_type: "restaurant",
      name: "Local Slice Shop",
      rating: 4.7,
      review_count: 900,
      has_photos: true,
      photo_status: "storage_cached",
      main_image: "https://example.com/slice.jpg",
      google_types: ["pizza_restaurant", "meal_takeaway", "restaurant"],
    };
    expect(applyLowLevelPenalty(500, item, "Italian dinner in Queens")).toBeLessThan(0);
  });

  it("boosts quick-bite candidates when the user explicitly asks for a quick bite", () => {
    const item = {
      location_type: "restaurant",
      name: "Local Slice Shop",
      rating: 4.7,
      review_count: 900,
      has_photos: true,
      photo_status: "storage_cached",
      main_image: "https://example.com/slice.jpg",
      google_types: ["pizza_restaurant", "meal_takeaway", "restaurant"],
    };
    expect(applyLowLevelPenalty(500, item, "quick bite near me")).toBeGreaterThan(500);
  });

  it("does not suppress full-service restaurants that also expose takeaway types", () => {
    const item = {
      location_type: "restaurant",
      name: "Harbor House",
      rating: 4.7,
      review_count: 900,
      has_photos: true,
      photo_status: "storage_cached",
      main_image: "https://example.com/harbor.jpg",
      google_types: ["seafood_restaurant", "meal_takeaway", "restaurant"],
      tags: ["dine in", "waterfront", "cocktails"],
    };
    expect(isQuickBiteSearchCandidate(item)).toBe(false);
    expect(isLowLevelLocation(item)).toBe(false);
  });

  it("classifies Yardies-shaped generic records as quick-bite candidates without hiding them", () => {
    const item = {
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
    };
    expect(isQuickBiteSearchCandidate(item)).toBe(true);
    expect(isLowLevelLocation(item)).toBe(false);
    expect(applyLowLevelPenalty(500, item, "Caribbean dinner in Queens")).toBeLessThan(0);
    expect(applyLowLevelPenalty(500, item, "quick bite Caribbean in Queens")).toBeGreaterThan(500);
  });

  it("keeps a generic restaurant above the discovery floor when it has dine-in evidence", () => {
    const item = {
      location_type: "restaurant",
      name: "Neighborhood Dining Room",
      rating: 4.3,
      review_count: 120,
      has_photos: true,
      photo_status: "storage_cached",
      main_image: "https://example.com/dining-room.jpg",
      google_types: ["restaurant", "food"],
      tags: ["dine in"],
    };
    expect(isQuickBiteSearchCandidate(item)).toBe(false);
    expect(isLowLevelLocation(item)).toBe(false);
  });
});
