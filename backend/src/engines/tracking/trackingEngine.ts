import connectDb from "../../../../src/lib/db";
import mongoose from "mongoose";
import emitEventHandler from "../../../../src/lib/emitEventHandler";
import { Milestone, OrderContext, TrackingSnapshot } from "../shared/types";
import {
  registerMilestoneInsight,
  computeTrackingInsights,
} from "./insights";

const trackingSchema = new mongoose.Schema(
  {
    orderId: mongoose.Schema.Types.ObjectId,
    milestone: String,
    recordedAt: { type: Date, default: Date.now },
    positionHint: { latitude: Number, longitude: Number },
    notes: String,
  },
  { timestamps: true }
);

const TrackingEvent =
  mongoose.models.TrackingEvent || mongoose.model("TrackingEvent", trackingSchema);

const offsets: Record<Milestone, [number, number]> = {
  "order.accepted": [-0.0025, -0.002],
  preparing: [-0.0015, -0.0015],
  packed: [-0.0008, -0.0008],
  picked: [0.0005, 0.0005],
  delivered: [0, 0],
};

const hint = (ctx: OrderContext, m: Milestone) => ({
  latitude: Number(ctx.address.latitude) + (offsets[m]?.[0] || 0),
  longitude: Number(ctx.address.longitude) + (offsets[m]?.[1] || 0),
});

export async function recordMilestone(
  ctx: OrderContext,
  milestone: Milestone,
  notes?: string
) {
  await connectDb();
  const positionHint = hint(ctx, milestone);
  const ev = await TrackingEvent.create({
    orderId: ctx.orderId,
    milestone,
    positionHint,
    notes,
  });
  await emitEventHandler("tracking-milestone", {
    orderId: ctx.orderId,
    milestone,
    positionHint,
    at: ev.recordedAt,
  });

  registerMilestoneInsight({
    orderId: ctx.orderId,
    campusZone: ctx.campusZone,
    vendorId: ctx.vendorId,
    milestone,
    at: ev.recordedAt,
  });

  try {
    const snapshot = await getTimeline(ctx.orderId);
    const insights = computeTrackingInsights(snapshot.timeline, {
      campusZone: ctx.campusZone,
      vendorId: ctx.vendorId,
    });
    await emitEventHandler("tracking-insights", {
      orderId: ctx.orderId,
      ...insights,
    });
  } catch (error) {
    // do not block milestone flow if insights computation fails
  }
  return ev;
}

export async function getTimeline(orderId: string): Promise<TrackingSnapshot> {
  await connectDb();
  const events = await TrackingEvent.find({ orderId }).sort({ recordedAt: 1 }).lean();
  return {
    orderId,
    timeline: events.map((e) => ({
      milestone: e.milestone as Milestone,
      at: e.recordedAt,
      positionHint: e.positionHint,
    })),
  };
}
