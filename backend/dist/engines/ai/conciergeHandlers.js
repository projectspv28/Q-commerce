"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conciergeHandlers = void 0;
exports.handleSlowZoneQuery = handleSlowZoneQuery;
exports.handleEcoAlternativesUnder100 = handleEcoAlternativesUnder100;
const cache_1 = require("../analytics/cache");
const insights_1 = require("../tracking/insights");
function handleSlowZoneQuery(zone, timeline) {
    const congestion = (0, cache_1.getQueuePressure)()?.[zone] ?? (0, insights_1.computeTrackingInsights)(timeline, { campusZone: zone }).congestionIndex;
    const guidance = congestion > 0.7
        ? "High congestion detected; suggest batching and staggered pickups."
        : "Zone running normal; check runner pool and prep SLAs.";
    return {
        zone,
        congestionIndex: Number(congestion.toFixed(3)),
        guidance,
    };
}
function handleEcoAlternativesUnder100() {
    const eco = (0, cache_1.getEcoRankings)() || [];
    const shortlist = eco
        .filter((e) => e.price <= 100)
        .slice(0, 5)
        .map((e) => ({
        name: e.name || e.label,
        price: e.price,
        ecoScore: e.score || e.ppiScore,
    }));
    return {
        suggestions: shortlist,
        note: shortlist.length === 0
            ? "Eco catalog under ₹100 not cached yet; refresh analytics cache."
            : "Eco suggestions ranked by PPI eco score.",
    };
}
exports.conciergeHandlers = {
    "slow in zone": handleSlowZoneQuery,
    "eco alternatives under 100": handleEcoAlternativesUnder100,
};
