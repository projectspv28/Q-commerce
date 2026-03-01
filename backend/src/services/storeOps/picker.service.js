import connectDb from "../../../../src/lib/db";
import Order from "../../../../src/models/order.model";
import { getAvailabilityMap } from "../../engines/inventory/inventoryEngine";
import { fetchBatchMeta } from "../../engines/batch/batchEngine";
import {
  recordMilestone,
  getTimeline,
} from "../../engines/tracking/trackingEngine";

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

export async function fetchPickerQueue(limit = 50) {
  await connectDb();
  const orders = await Order.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  const queue = await Promise.all(
    orders.map(async (o) => {
      const availability = await getAvailabilityMap(
        (o.items || []).map((i) => i.grocery?.toString())
      );
      const batch = await fetchBatchMeta(o._id.toString());
      const timeline = await getTimeline(o._id.toString());
      const packedEvent = timeline?.timeline?.find(
        (e) => e.milestone === "packed"
      );

      return {
        orderId: o._id.toString(),
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        status: o.status,
        batch,
        packedAt: packedEvent?.at,
        items: (o.items || []).map((i) => ({
          groceryId: i.grocery?.toString(),
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          price: Number(i.price),
          image: i.image,
          availability: availability[i.grocery?.toString()]?.available,
          reserved: availability[i.grocery?.toString()]?.reserved,
          soldOut: availability[i.grocery?.toString()]?.soldOut,
        })),
      };
    })
  );

  return queue;
}

export async function markOrderPacked(orderId, operatorId, note) {
  await connectDb();
  const order = await Order.findById(orderId);
  if (!order) throw new Error("order_not_found");

  const ctx = buildOrderContext(order);
  const packedNote = [note, operatorId ? `packed_by:${operatorId}` : ""]
    .filter(Boolean)
    .join(" | ");

  const event = await recordMilestone(ctx, "packed", packedNote || undefined);

  return {
    orderId: orderId.toString(),
    packedAt: event?.recordedAt || event?.createdAt || new Date(),
    trackingEventId: event?._id?.toString?.(),
  };
}
