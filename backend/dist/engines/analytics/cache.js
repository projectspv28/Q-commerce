"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsCacheMeta = exports.getBatchHeatmap = exports.getVendorPerformance = exports.getQueuePressure = exports.getEcoRankings = void 0;
exports.setAnalyticsCache = setAnalyticsCache;
exports.resetAnalyticsCache = resetAnalyticsCache;
const cache = {
    ecoRankings: [],
    queuePressure: {},
    vendorPerformance: [],
    batchHeatmap: [],
    updatedAt: undefined,
};
function setAnalyticsCache(partial) {
    Object.assign(cache, partial, { updatedAt: new Date() });
    return cache;
}
const getEcoRankings = () => cache.ecoRankings;
exports.getEcoRankings = getEcoRankings;
const getQueuePressure = () => cache.queuePressure;
exports.getQueuePressure = getQueuePressure;
const getVendorPerformance = () => cache.vendorPerformance;
exports.getVendorPerformance = getVendorPerformance;
const getBatchHeatmap = () => cache.batchHeatmap;
exports.getBatchHeatmap = getBatchHeatmap;
const getAnalyticsCacheMeta = () => ({ updatedAt: cache.updatedAt });
exports.getAnalyticsCacheMeta = getAnalyticsCacheMeta;
function resetAnalyticsCache() {
    cache.ecoRankings = [];
    cache.queuePressure = {};
    cache.vendorPerformance = [];
    cache.batchHeatmap = [];
    cache.updatedAt = new Date();
}
