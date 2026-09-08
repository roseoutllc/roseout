import { describe, expect, it, vi } from "vitest";
import { retrieveProfileLocations } from "../retrieval/retrieveProfileLocations";
import { hydrateLegacyRestaurantMenuEvidence, needsLegacyMenuEvidenceHydration } from "../retrieval/hydrateLegacyMenuEvidence";

const geo:any={source:"current_location",market:"NYC_LONG_ISLAND",city:"New York",borough:null,neighborhood:null,county:null,state:"NY",latitude:40.758,longitude:-73.9855,radiusMiles:6,strictness:"preferred"};
const lowLevelRequest:any={desiredRole:"restaurant",cuisines:[],foods:["quick bite"],categories:[],features:[],retrievalTerms:["deli","quick bite"],eligibleStorageTypes:["restaurant"],geo,allowLowLevel:true};

describe("explicit low-level retrieval fast path",()=>{
  it("skips canonical profile scouting for explicit deli/takeout intent",async()=>{
    const rpc=vi.fn();
    const result=await retrieveProfileLocations({rpc} as never,lowLevelRequest,50,true);
    expect(result).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("skips legacy menu hydration for explicit low-level intent",async()=>{
    const from=vi.fn();
    const rows=[{id:"deli-1",name:"Neighborhood Deli"}];
    expect(needsLegacyMenuEvidenceHydration(lowLevelRequest)).toBe(false);
    const result=await hydrateLegacyRestaurantMenuEvidence({supabase:{from} as never,request:lowLevelRequest,rows});
    expect(result).toBe(rows);
    expect(from).not.toHaveBeenCalled();
  });

  it("keeps menu hydration eligible for normal multi-word dish searches",()=>{
    const request={...lowLevelRequest,allowLowLevel:false,foods:["lobster ravioli"],retrievalTerms:["lobster ravioli"]};
    expect(needsLegacyMenuEvidenceHydration(request)).toBe(true);
  });
});