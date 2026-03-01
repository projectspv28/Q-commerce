import { Milestone } from "../shared/types";

type TimelinePoint = { milestone: Milestone; at: Date };
type Timeline = TimelinePoint[];

const zoneLags: Record<string, number[]> = {};
const vendorPrepLoad: Record<string, number> = {};
const lastMilestoneAt: Record<string, Partial<Record<Milestone, Date>>> = {};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const avg = (arr: number[]) =>
  arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;

const updateZoneLag = (zone: string, lagMinutes: number) => {
  const list = zoneLags[zone] || [];
  list.unshift(lagMinutes);
  if (list.length > 50) list.pop();
  zoneLags[zone] = list;
};

const updateVendorLoad = (vendorId: string, delta: number) => {
  vendorPrepLoad[vendorId] = Math.max(0, (vendorPrepLoad[vendorId] || 0) + delta);
};

const recordOrderMilestone = (
  orderId: string,
  milestone: Milestone,
  at: Date
) => {
  const map = lastMilestoneAt[orderId] || {};
  map[milestone] = at;
  lastMilestoneAt[orderId] = map;
};

const minutesBetween = (a?: Date, b?: Date) =>
  !a || !b ? undefined : (b.getTime() - a.getTime()) / 60000;

export function computeTrackingInsights(
  timeline: Timeline,
  opts: { campusZone?: string; vendorId?: string }
) {
  const accepted = timeline.find((t) => t.milestone === "order.accepted")?.at;
  const packed = timeline.find((t) => t.milestone === "packed")?.at;
  const picked = timeline.find((t) => t.milestone === "picked")?.at;
  const delivered = timeline.find((t) => t.milestone === "delivered")?.at;

  const prepMinutes = minutesBetween(accepted, packed || picked);
  const lastMileMinutes = minutesBetween(picked || packed, delivered);

  const prepScore = prepMinutes
    ? clamp01(prepMinutes / 18) // >18 mins increases delay risk
    : 0.2;
  const lastMileScore = lastMileMinutes
    ? clamp01(lastMileMinutes / 22)
    : 0.2;

  const delayProbability = Number(
    ((prepScore * 0.6 + lastMileScore * 0.4)).toFixed(3)
  );

  const zoneLag =
    opts.campusZone && zoneLags[opts.campusZone]
      ? avg(zoneLags[opts.campusZone])
      : prepMinutes || 0;
  const congestionIndex = Number(clamp01((zoneLag || 0) / 20).toFixed(3)); // 20 min prep lag threshold

  const overloadRatio = vendorPrepLoad[opts.vendorId || ""] || 0;
  const kitchenOverload = Number(clamp01(overloadRatio / 8).toFixed(3)); // >8 active orders = overload

  return {
    delayProbability,
    congestionIndex,
    kitchenOverload,
    observed: { prepMinutes, lastMileMinutes },
  };
}

export function registerMilestoneInsight(event: {
  orderId: string;
  campusZone?: string;
  vendorId?: string;
  milestone: Milestone;
  at?: Date;
}) {
  const at = event.at || new Date();
  recordOrderMilestone(event.orderId, event.milestone, at);

  if (event.milestone === "order.accepted") {
    if (event.vendorId) updateVendorLoad(event.vendorId, 1);
  }
  if (["packed", "picked", "delivered"].includes(event.milestone)) {
    if (event.vendorId) updateVendorLoad(event.vendorId, -1);
  }

  const packedAt = lastMilestoneAt[event.orderId]?.packed;
  const pickedAt = lastMilestoneAt[event.orderId]?.picked;
  const acceptedAt = lastMilestoneAt[event.orderId]?.["order.accepted"];

  if (event.campusZone && packedAt && pickedAt) {
    const lag = minutesBetween(packedAt, pickedAt);
    if (typeof lag === "number") updateZoneLag(event.campusZone, lag);
  }
  if (event.campusZone && acceptedAt && packedAt && !pickedAt) {
    const lag = minutesBetween(acceptedAt, packedAt);
    if (typeof lag === "number") updateZoneLag(event.campusZone, lag);
  }
}
