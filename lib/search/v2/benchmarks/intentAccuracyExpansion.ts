import type { IntentBenchmarkCase, IntentExpectation } from "./intentAccuracyCorpus";

const cuisines = [["Italian","italian"],["Mexican","mexican"],["Thai","thai"],["Indian","indian"],["Chinese","chinese"],["Japanese","japanese"],["Korean","korean"],["Caribbean","caribbean"],["Jamaican","jamaican"],["Haitian","haitian"],["Seafood","seafood"],["Sushi","sushi"],["Steakhouse","steakhouse"],["Peruvian","peruvian"],["Vegan","vegan"]] as const;
const activities = [["bowling","bowling"],["karaoke","karaoke"],["a comedy show","comedy"],["an escape room","escape_room"],["mini golf","mini_golf"],["an arcade","arcade"],["live music","live_music"],["a rooftop lounge","rooftop"]] as const;
const neighborhoods = ["Astoria","Flushing","Forest Hills","Long Island City","Harlem","Williamsburg","Bushwick","Jackson Heights","Huntington","Patchogue"] as const;

const cases: IntentBenchmarkCase[] = [];
let id = 0;
const add = (query: string, expected: IntentExpectation) => cases.push({
  id: `expansion-${String(++id).padStart(4, "0")}`,
  category: "combination",
  query,
  expected,
  source: "stress_generated",
});

for (const [cuisineLabel, cuisine] of cuisines) {
  for (const [activityLabel, activity] of activities) {
    add(`${cuisineLabel} dinner and ${activityLabel} near me`, {
      mode: "paired_outing", restaurantRequired: true, activityRequired: true,
      cuisinesAnyOf: [cuisine], activityCategoriesAnyOf: [activity],
    });
    add(`looking for ${cuisineLabel.toLowerCase()} food then ${activityLabel}, nothing too far`, {
      mode: "paired_outing", restaurantRequired: true, activityRequired: true,
      cuisinesAnyOf: [cuisine], activityCategoriesAnyOf: [activity],
    });
  }
}

for (const neighborhood of neighborhoods) {
  for (const [activityLabel, activity] of activities) {
    add(`dinner then ${activityLabel} around ${neighborhood}`, {
      mode: "paired_outing", restaurantRequired: true, activityRequired: true,
      neighborhood, activityCategoriesAnyOf: [activity],
    });
  }
}

export const INTENT_ACCURACY_EXPANSION = Object.freeze(cases);
