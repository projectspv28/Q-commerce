"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMilestone = recordMilestone;
exports.getTimeline = getTimeline;
const db_1 = __importDefault(require("../../../../src/lib/db"));
const mongoose_1 = __importDefault(require("mongoose"));
const emitEventHandler_1 = __importDefault(require("../../../../src/lib/emitEventHandler"));
const insights_1 = require("./insights");
const trackingSchema = new mongoose_1.default.Schema({
    orderId: mongoose_1.default.Schema.Types.ObjectId,
    milestone: String,
    recordedAt: { type: Date, default: Date.now },
    positionHint: { latitude: Number, longitude: Number },
    notes: String,
}, { timestamps: true });
const TrackingEvent = mongoose_1.default.models.TrackingEvent || mongoose_1.default.model("TrackingEvent", trackingSchema);
const offsets = {
    "order.accepted": [-0.0025, -0.002],
    preparing: [-0.0015, -0.0015],
    packed: [-0.0008, -0.0008],
    picked: [0.0005, 0.0005],
    delivered: [0, 0],
};
const hint = (ctx, m) => ({
    latitude: Number(ctx.address.latitude) + (offsets[m]?.[0] || 0),
    longitude: Number(ctx.address.longitude) + (offsets[m]?.[1] || 0),
});
async function recordMilestone(ctx, milestone, notes) {
    await (0, db_1.default)();
    const positionHint = hint(ctx, milestone);
    const ev = await TrackingEvent.create({
        orderId: ctx.orderId,
        milestone,
        positionHint,
        notes,
    });
    await (0, emitEventHandler_1.default)("tracking-milestone", {
        orderId: ctx.orderId,
        milestone,
        positionHint,
        at: ev.recordedAt,
    });
    (0, insights_1.registerMilestoneInsight)({
        orderId: ctx.orderId,
        campusZone: ctx.campusZone,
        vendorId: ctx.vendorId,
        milestone,
        at: ev.recordedAt,
    });
    try {
        const snapshot = await getTimeline(ctx.orderId);
        const insights = (0, insights_1.computeTrackingInsights)(snapshot.timeline, {
            campusZone: ctx.campusZone,
            vendorId: ctx.vendorId,
        });
        await (0, emitEventHandler_1.default)("tracking-insights", {
            orderId: ctx.orderId,
            ...insights,
        });
    }
    catch (error) {
        // do not block milestone flow if insights computation fails
    }
    return ev;
}
async function getTimeline(orderId) {
    await (0, db_1.default)();
    const events = await TrackingEvent.find({ orderId }).sort({ recordedAt: 1 }).lean();
    return {
        orderId,
        timeline: events.map((e) => ({
            milestone: e.milestone,
            at: e.recordedAt,
            positionHint: e.positionHint,
        })),
    };
}
