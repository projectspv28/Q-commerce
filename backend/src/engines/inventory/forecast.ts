import connectDb from "../../lib/db";
import mongoose from "mongoose";
import type { PipelineStage } from "mongoose";


const stockSchema = new mongoose.Schema(
  {
    groceryId: String,
    available: { type: Number, default: 50 },
    reserved: { type: Number, default: 0 },
    soldOut: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const reservationSchema = new mongoose.Schema(
  {
    orderId: mongoose.Schema.Types.ObjectId,
    items: [
      {
        groceryId: String,
        quantity: Number,
        status: { type: String, enum: ["reserved", "deducted"] },
      },
    ],
  },
  { timestamps: true }
);

const InventoryStock =
  mongoose.models.InventoryStock ||
  mongoose.model("InventoryStock", stockSchema);
const InventoryReservation =
  mongoose.models.InventoryReservation ||
  mongoose.model("InventoryReservation", reservationSchema);

const hoursAgo = (hrs: number) => new Date(Date.now() - hrs * 3600000);

export async function computeVelocity(
  groceryId: string,
  lookbackHours = 24
) {
  await connectDb();
  const since = hoursAgo(lookbackHours);
  const reservations = await InventoryReservation.find({
    createdAt: { $gte: since },
    "items.groceryId": groceryId,
  })
    .select("items createdAt")
    .lean();

  let qty = 0;
  reservations.forEach((r: any) => {
    r.items?.forEach((i: any) => {
      if (i.groceryId === groceryId) qty += Number(i.quantity || 0);
    });
  });

  const velocityPerHour = Number(
    (qty / Math.max(1, lookbackHours)).toFixed(2)
  );

  return { groceryId, velocityPerHour, samples: reservations.length };
}

export async function forecastRunoutAt(
  groceryId: string,
  lookbackHours = 24
) {
  await connectDb();
  const stock = await InventoryStock.findOne({ groceryId }).lean();
  if (!stock) return null;

  const { velocityPerHour } = await computeVelocity(groceryId, lookbackHours);
  const available = Math.max(
    0,)
    
    const s = stock as any;
     ((s.available || 0) - (s.reserved || 0)
  );

  if (!velocityPerHour || velocityPerHour <= 0) {
    return { groceryId, available, velocityPerHour, forecastRunoutAt: null };
  }

  const hoursLeft = available / velocityPerHour;
  const runoutAt = new Date(Date.now() + hoursLeft * 3600000);

  return {
    groceryId,
    available,
    velocityPerHour,
    forecastRunoutAt: runoutAt,
  };
}

export async function getFastMovers(
  limit = 10,
  lookbackHours = 24
) {
  await connectDb();
  const since = hoursAgo(lookbackHours);

  const pipeline = [
    { $match: { createdAt: { $gte: since } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.groceryId",
        qty: { $sum: "$items.quantity" },
        count: { $sum: 1 },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: limit },
  ];

  const rows = await InventoryReservation.aggregate(pipeline as PipelineStage[]);

  return rows.map((r: any) => ({
    groceryId: r._id,
    totalReserved: r.qty,
    orders: r.count,
    velocityPerHour: Number((r.qty / Math.max(1, lookbackHours)).toFixed(2)),
  }));
}
