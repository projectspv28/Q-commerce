import connectDb from "../../../../src/lib/db";
import Order from "../../../../src/models/order.model";
import User from "../../../../src/models/user.model";
import { BatchMetadata, OrderContext } from "../shared/types";
import { getTimeline } from "../tracking/trackingEngine";

let adminCache: any = null;
let conciergeCache: any = null;
let adminCachedAt = 0;
const ttl = 2 * 60 * 1000;

const moveLog: any[] = [];

export async function getAdminSnapshot() {
  if (adminCache && Date.now() - adminCachedAt < ttl) return adminCache;
  await connectDb();
  const orders = await Order.find({}).lean();
  const users = await User.find({ role: "user" }).lean();

  const totalOrders = orders.length;
  const totalCustomers = users.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const chartData: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const n = new Date(d);
    n.setDate(n.getDate() + 1);
    chartData.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      orders: orders.filter(
        (o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < n
      ).length,
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

export function recordPlacement(ctx: OrderContext, batch?: BatchMetadata) {
  adminCache = null;
  conciergeCache = {
    ecoScore: ctx.ppiScore,
    batchClosesIn: batch?.closesInMinutes,
    campusZone: ctx.campusZone,
    paymentMethod: ctx.paymentMethod,
  };
}

export function recordDeliveryAnalytics() {
  adminCache = null;
}

export const getConciergeDigest = () => conciergeCache || {};

const minutesBetween = (a?: Date, b?: Date) => {
  if (!a || !b) return undefined;
  return Number(((b.getTime() - a.getTime()) / 60000).toFixed(2));
};

export async function computeOrderDurations(orderIds: string[]) {
  const durations: {
    orderId: string;
    pickerMinutes?: number;
    runnerMinutes?: number;
    totalMinutes?: number;
  }[] = [];

  for (const orderId of orderIds) {
    const timeline = await getTimeline(orderId);
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

const average = (values: (number | undefined)[]) => {
  const filtered = values.filter((v): v is number => typeof v === "number");
  if (!filtered.length) return undefined;
  const sum = filtered.reduce((s, n) => s + n, 0);
  return Number((sum / filtered.length).toFixed(2));
};

export async function summarizePartnerPerformance(orderIds: string[]) {
  const durations = await computeOrderDurations(orderIds);
  return {
    sample: durations.length,
    pickerAvgMins: average(durations.map((d) => d.pickerMinutes)),
    runnerAvgMins: average(durations.map((d) => d.runnerMinutes)),
    totalAvgMins: average(durations.map((d) => d.totalMinutes)),
  };
}

export function recordStockMove(move: {
  groceryId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  operatorId?: string;
  note?: string;
}) {
  const entry = {
    ...move,
    movedAt: new Date(),
  };
  moveLog.unshift(entry);
  if (moveLog.length > 50) moveLog.pop();
  adminCache = null;
  return entry;
}

export function getRecentStockMoves(limit = 20) {
  return moveLog.slice(0, limit);
}
