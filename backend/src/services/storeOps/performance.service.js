import connectDb from "../../../../src/lib/db";
import Order from "../../../../src/models/order.model";
import { summarizePartnerPerformance } from "../../engines/analytics/analyticsEngine";
import { deriveOrderPpi } from "../../engines/ppi/ppiEngine";

const buildOrderContext = (order) => ({
  orderId: order._id.toString(),
  userId: order.user?.toString(),
  campusZone: order.address?.pincode || order.address?.city || "default",
  vendorId: order.items?.[0]?.grocery?.toString() || "default",
  totalAmount: order.totalAmount,
  paymentMethod: order.paymentMethod,
  address: {
    latitude: order.address?.latitude,
    longitude: order.address?.longitude,
    city: order.address?.city,
    pincode: order.address?.pincode,
  },
  items: (order.items || []).map((i) => ({
    groceryId: i.grocery?.toString(),
    name: i.name,
    unit: i.unit,
    price: Number(i.price),
    quantity: i.quantity,
    image: i.image,
  })),
});

const average = (values) => {
  const filtered = values.filter((v) => typeof v === "number");
  if (!filtered.length) return undefined;
  return Number(
    (filtered.reduce((sum, n) => sum + n, 0) / filtered.length).toFixed(2)
  );
};

export async function getPerformanceSnapshot(windowDays = 7) {
  await connectDb();
  const since = new Date(Date.now() - Number(windowDays) * 24 * 60 * 60 * 1000);

  const orders = await Order.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const orderIds = orders.map((o) => o._id.toString());
  const durations = await summarizePartnerPerformance(orderIds);

  const ppiScores: number[] = [];
  for (const order of orders) {
    try {
      const ctx = buildOrderContext(order);
      const score = await deriveOrderPpi(ctx);
      if (typeof score === "number") ppiScores.push(score);
    } catch (e) {
      // ignore ppi derivation errors for performance snapshot
    }
  }

  return {
    windowDays: Number(windowDays),
    sampleOrders: orderIds.length,
    pickerAvgMins: durations.pickerAvgMins,
    runnerAvgMins: durations.runnerAvgMins,
    totalAvgMins: durations.totalAvgMins,
    avgOrderPpi: average(ppiScores),
  };
}
