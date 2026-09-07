import type { EnterpriseSearchResult } from "@/lib/search/enterprise/types";
import { applyFinalRestaurantEligibility } from "./finalRestaurantEligibility";
import { runOutingSearch as runOutingSearchImpl, type RunOutingSearchInput } from "./runSearchImpl";
import { withSearchUserContext } from "./searchUserContext";

export type { RunOutingSearchInput };

export async function runOutingSearch(input: RunOutingSearchInput): Promise<EnterpriseSearchResult> {
  return withSearchUserContext(input.userId ?? null, async () => {
    const result = await runOutingSearchImpl(input);
    return applyFinalRestaurantEligibility(result, input.query);
  });
}
