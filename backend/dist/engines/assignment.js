"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignOrderToBatch = assignOrderToBatch;
exports.getBatchMeta = getBatchMeta;
const batchEngine_1 = require("./batch/batchEngine");
const batchScore_1 = require("./batchScore");
const scoreCache = {};
const defaultSignals = {
    prepSLA: 30,
    zoneDensity: 0.4,
    runnerAvailability: 0.6,
    ppiBoost: 50,
    queuePressure: 0.4,
};
async function assignOrderToBatch(ctx, signals = {}) {
    const mergedSignals = { ...defaultSignals, ...signals };
    const { batchScore, reasonCodes } = (0, batchScore_1.calculateBatchScore)(mergedSignals);
    const batchMeta = await (0, batchEngine_1.prepareBatchMetadata)(ctx);
    scoreCache[ctx.orderId] = { batchScore, reasonCodes };
    return {
        ...batchMeta,
        batchScore,
        reasonCodes,
    };
}
async function getBatchMeta(orderId) {
    const meta = await (0, batchEngine_1.fetchBatchMeta)(orderId);
    if (!meta)
        return null;
    return {
        ...meta,
        ...(scoreCache[orderId] || {}),
    };
}
