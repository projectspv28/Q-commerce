"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBatchScore = calculateBatchScore;
const clamp01 = (n) => Math.min(1, Math.max(0, n));
const normalizeInverse = (value, best, worst) => clamp01((worst - value) / Math.max(1, worst - best));
const normalizeDirect = (value, ceiling) => clamp01(value / Math.max(1, ceiling));
const weights = {
    prepSLA: 0.25,
    zoneDensity: 0.2,
    runnerAvailability: 0.2,
    ppiBoost: 0.2,
    queuePressure: 0.15,
};
function calculateBatchScore(signals) {
    const prep = normalizeInverse(signals.prepSLA || 45, 10, 60);
    const density = clamp01(signals.zoneDensity || 0);
    const runners = clamp01(signals.runnerAvailability || 0);
    const eco = normalizeDirect(signals.ppiBoost || 0, 100);
    // Higher pressure should discourage adding to busy queues; invert
    const pressure = normalizeInverse(signals.queuePressure || 0, 0.2, 1);
    const batchScore = Number((prep * weights.prepSLA +
        density * weights.zoneDensity +
        runners * weights.runnerAvailability +
        eco * weights.ppiBoost +
        pressure * weights.queuePressure).toFixed(3));
    const reasonCodes = [];
    if (prep < 0.3)
        reasonCodes.push("slow_prep");
    if (prep > 0.7)
        reasonCodes.push("fast_prep");
    if (density > 0.7)
        reasonCodes.push("high_density");
    if (runners < 0.3)
        reasonCodes.push("low_runner_pool");
    if (eco > 0.7)
        reasonCodes.push("eco_priority");
    if (pressure < 0.3)
        reasonCodes.push("queue_pressure_high");
    return { batchScore, reasonCodes };
}
