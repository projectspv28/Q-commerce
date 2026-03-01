import { getQueuePressure, getEcoRankings } from "../analytics/cache";
import { computeTrackingInsights } from "../tracking/insights";

type TimelinePoint = { milestone: string; at: Date };

export function handleSlowZoneQuery(zone: string, timeline: TimelinePoint[]) {
  const congestion =
    getQueuePressure()?.[zone] ?? computeTrackingInsights(timeline as any, { campusZone: zone }).congestionIndex;

  const guidance =
    congestion > 0.7
      ? "High congestion detected; suggest batching and staggered pickups."
      : "Zone running normal; check runner pool and prep SLAs.";

  return {
    zone,
    congestionIndex: Number(congestion.toFixed(3)),
    guidance,
  };
}

export function handleEcoAlternativesUnder100() {
  const eco = getEcoRankings() || [];
  const shortlist = eco
    .filter((e: any) => e.price <= 100)
    .slice(0, 5)
    .map((e: any) => ({
      name: e.name || e.label,
      price: e.price,
      ecoScore: e.score || e.ppiScore,
    }));

  return {
    suggestions: shortlist,
    note:
      shortlist.length === 0
        ? "Eco catalog under ₹100 not cached yet; refresh analytics cache."
        : "Eco suggestions ranked by PPI eco score.",
  };
}

export const conciergeHandlers = {
  "slow in zone": handleSlowZoneQuery,
  "eco alternatives under 100": handleEcoAlternativesUnder100,
};
