import connectDb from "../../../../src/lib/db";
import mongoose from "mongoose";
import { OrderContext } from "../shared/types";

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

async function refreshSoldOutFlags() {
  const stocks = await InventoryStock.find({});
  await Promise.all(
    stocks.map((s) =>
      InventoryStock.updateOne(
        { _id: s._id },
        { $set: { soldOut: (s.available || 0) - (s.reserved || 0) <= 0 } }
      )
    )
  );
}

export async function reserveStockForOrder(ctx: OrderContext) {
  await connectDb();
  const shortfalls: string[] = [];

  for (const item of ctx.items) {
    const stock = await InventoryStock.findOneAndUpdate(
      { groceryId: item.groceryId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if ((stock.available || 0) - (stock.reserved || 0) < item.quantity) {
      shortfalls.push(item.name || item.groceryId);
    }
  }

  if (shortfalls.length) throw new Error(`sold_out:${shortfalls.join(",")}`);

  await Promise.all(
    ctx.items.map((i) =>
      InventoryStock.updateOne(
        { groceryId: i.groceryId },
        { $inc: { reserved: i.quantity }, $set: { soldOut: false } }
      )
    )
  );

  await InventoryReservation.create({
    orderId: ctx.orderId,
    items: ctx.items.map((i) => ({
      groceryId: i.groceryId,
      quantity: i.quantity,
      status: "reserved",
    })),
  });

  await refreshSoldOutFlags();
}

export async function deductStockOnDelivery(orderId: string) {
  await connectDb();
  const res = await InventoryReservation.findOne({ orderId });
  if (!res) return;

  for (const i of res.items) {
    await InventoryStock.updateOne(
      { groceryId: i.groceryId },
      { $inc: { available: -i.quantity, reserved: -i.quantity } }
    );
    i.status = "deducted";
  }

  res.markModified("items");
  await res.save();
  await refreshSoldOutFlags();
}

export async function getAvailabilityMap(ids: string[]) {
  await connectDb();
  const stocks = await InventoryStock.find({ groceryId: { $in: ids } }).lean();
  return stocks.reduce((acc: any, s: any) => {
    acc[s.groceryId] = {
      soldOut: s.soldOut,
      available: Math.max(0, (s.available || 0) - (s.reserved || 0)),
    };
    return acc;
  }, {});
}
