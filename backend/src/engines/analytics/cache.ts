type CacheShape = {
  ecoRankings: any[];
  queuePressure: Record<string, number>;
  vendorPerformance: any[];
  batchHeatmap: any[];
  updatedAt?: Date;
};

const cache: CacheShape = {
  ecoRankings: [],
  queuePressure: {},
  vendorPerformance: [],
  batchHeatmap: [],
  updatedAt: undefined,
};

export function setAnalyticsCache(partial: Partial<CacheShape>) {
  Object.assign(cache, partial, { updatedAt: new Date() });
  return cache;
}

export const getEcoRankings = () => cache.ecoRankings;
export const getQueuePressure = () => cache.queuePressure;
export const getVendorPerformance = () => cache.vendorPerformance;
export const getBatchHeatmap = () => cache.batchHeatmap;
export const getAnalyticsCacheMeta = () => ({ updatedAt: cache.updatedAt });

export function resetAnalyticsCache() {
  cache.ecoRankings = [];
  cache.queuePressure = {};
  cache.vendorPerformance = [];
  cache.batchHeatmap = [];
  cache.updatedAt = new Date();
}
