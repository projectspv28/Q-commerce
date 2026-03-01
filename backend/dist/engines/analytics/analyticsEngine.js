"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConciergeDigest = void 0;
exports.getAdminSnapshot = getAdminSnapshot;
exports.recordPlacement = recordPlacement;
exports.recordDeliveryAnalytics = recordDeliveryAnalytics;
exports.computeOrderDurations = computeOrderDurations;
exports.summarizePartnerPerformance = summarizePartnerPerformance;
exports.recordStockMove = recordStockMove;
exports.getRecentStockMoves = getRecentStockMoves;
const db_1 = __importDefault(require("../../../../src/lib/db"));
const order_model_1 = __importDefault(require("../../../../src/models/order.model"));
const user_model_1 = __importDefault(require("../../../../src/models/user.model"));
const trackingEngine_1 = require("../tracking/trackingEngine");
let adminCache = null;
let conciergeCache = null;
let adminCachedAt = 0;
const ttl = 2 * 60 * 1000;
const moveLog = [];
async function getAdminSnapshot() {
    if (adminCache && Date.now() - adminCachedAt < ttl)
        return adminCache;
    await (0, db_1.default)();
    const orders = await order_model_1.default.find({}).lean();
    const users = await user_model_1.default.find({ role: "user" }).lean();
    const totalOrders = orders.length;
    const totalCustomers = users.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const n = new Date(d);
        n.setDate(n.getDate() + 1);
        chartData.push({
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            orders: orders.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < n).length,
        });
    }
    adminCache = {
        totalOrders,
        totalCustomers,
        pendingDeliveries: pending,
        totalRevenue,
        chartData,
        queueLength: pending,
    };
    adminCachedAt = Date.now();
    return adminCache;
}
function recordPlacement(ctx, batch) {
    adminCache = null;
    conciergeCache = {
        ecoScore: ctx.ppiScore,
        batchClosesIn: batch?.closesInMinutes,
        campusZone: ctx.campusZone,
        paymentMethod: ctx.paymentMethod,
    };
}
function recordDeliveryAnalytics() {
    adminCache = null;
}
const getConciergeDigest = () => conciergeCache || {};
exports.getConciergeDigest = getConciergeDigest;
const minutesBetween = (a, b) => {
    if (!a || !b)
        return undefined;
    return Number(((b.getTime() - a.getTime()) / 60000).toFixed(2));
};
async function computeOrderDurations(orderIds) {
    const durations = [];
    for (const orderId of orderIds) {
        const timeline = await (0, trackingEngine_1.getTimeline)(orderId);
        const events = timeline?.timeline || [];
        const accepted = events.find((e) => e.milestone === "order.accepted")?.at;
        const packed = events.find((e) => e.milestone === "packed")?.at;
        const picked = events.find((e) => e.milestone === "picked")?.at;
        const delivered = events.find((e) => e.milestone === "delivered")?.at;
        durations.push({
            orderId,
            pickerMinutes: minutesBetween(accepted, packed),
            runnerMinutes: minutesBetween(packed || picked, delivered),
            totalMinutes: minutesBetween(accepted, delivered),
        });
    }
    return durations;
}
const average = (values) => {
    const filtered = values.filter((v) => typeof v === "number");
    if (!filtered.length)
        return undefined;
    const sum = filtered.reduce((s, n) => s + n, 0);
    return Number((sum / filtered.length).toFixed(2));
};
async function summarizePartnerPerformance(orderIds) {
    const durations = await computeOrderDurations(orderIds);
    return {
        sample: durations.length,
        pickerAvgMins: average(durations.map((d) => d.pickerMinutes)),
        runnerAvgMins: average(durations.map((d) => d.runnerMinutes)),
        totalAvgMins: average(durations.map((d) => d.totalMinutes)),
    };
}
function recordStockMove(move) {
    const entry = {
        ...move,
        movedAt: new Date(),
    };
    moveLog.unshift(entry);
    if (moveLog.length > 50)
        moveLog.pop();
    adminCache = null;
    return entry;
}
function getRecentStockMoves(limit = 20) {
    return moveLog.slice(0, limit);
}
