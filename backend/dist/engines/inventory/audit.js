"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeVariance = computeVariance;
function computeVariance(lines) {
    const enriched = (lines || []).map((l) => {
        const variance = Number((l.physical - l.expected).toFixed(2));
        let status = "match";
        if (variance < 0)
            status = "short";
        if (variance > 0)
            status = "over";
        return { ...l, variance, status };
    });
    const totals = enriched.reduce((acc, l) => {
        acc.skuCount += 1;
        if (l.status === "match")
            acc.matched += 1;
        if (l.status === "short")
            acc.short += 1;
        if (l.status === "over")
            acc.over += 1;
        acc.netVariance += l.variance;
        return acc;
    }, { skuCount: 0, matched: 0, short: 0, over: 0, netVariance: 0 });
    totals.netVariance = Number(totals.netVariance.toFixed(2));
    return {
        lines: enriched,
        totals,
        auditedAt: new Date(),
    };
}
