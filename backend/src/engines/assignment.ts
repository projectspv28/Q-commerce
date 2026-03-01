import { prepareBatchMetadata, fetchBatchMeta } from "./batch/batchEngine";
import { OrderContext } from "./shared/types";
import { calculateBatchScore, BatchSignals } from "./batchScore";

type ScoreCache = Record<
  string,
  {
    batchScore: number;
    reasonCodes: string[];
  }
>;

const scoreCache: ScoreCache = {};

const defaultSignals: BatchSignals = {
  prepSLA: 30,
  zoneDensity: 0.4,
  runnerAvailability: 0.6,
  ppiBoost: 50,
  queuePressure: 0.4,
};

export async function assignOrderToBatch(
  ctx: OrderContext,
  signals: Partial<BatchSignals> = {}
) {
  const mergedSignals = { ...defaultSignals, ...signals };
  const { batchScore, reasonCodes } = calculateBatchScore(
    mergedSignals as BatchSignals
  );

  const batchMeta = await prepareBatchMetadata(ctx);
  scoreCache[ctx.orderId] = { batchScore, reasonCodes };

  return {
    ...batchMeta,
    batchScore,
    reasonCodes,
  };
}

export async function getBatchMeta(orderId: string) {
  const meta = await fetchBatchMeta(orderId);
  if (!meta) return null;
  return {
    ...meta,
    ...(scoreCache[orderId] || {}),
  };
}
