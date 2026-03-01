import connectDb from "../../../../src/lib/db";
import mongoose from "mongoose";
import { BatchMetadata, OrderContext } from "../shared/types";

const batchSchema = new mongoose.Schema(
  {
    batchKey: String,
    vendorId: String,
    campusZone: String,
    closesAt: Date,
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    priorityScore: Number,
  },
  { timestamps: true }
);

const BatchTicket =
  mongoose.models.BatchTicket || mongoose.model("BatchTicket", batchSchema);

const WINDOW_MINUTES = 8;

const priority = (ctx: OrderContext) =>
  Number((1 + (ctx.ppiScore || 0) / 100 + ctx.totalAmount / 5000).toFixed(2));

export async function prepareBatchMetadata(
  ctx: OrderContext
): Promise<BatchMetadata> {
  await connectDb();
  const now = new Date();
  const closing = new Date(now.getTime() + WINDOW_MINUTES * 60000);
  const batchKey = `${ctx.vendorId}-${ctx.campusZone}`;

  let ticket = await BatchTicket.findOne({
    batchKey,
    closesAt: { $gt: now },
  });

  if (!ticket) {
    ticket = await BatchTicket.create({
      batchKey,
      vendorId: ctx.vendorId,
      campusZone: ctx.campusZone,
      closesAt: closing,
      orders: [],
      priorityScore: priority(ctx),
    });
  }

  if (
    !ticket.orders.find(
      (o: any) => o.toString() === ctx.orderId.toString()
    )
  ) {
    ticket.orders.push(new mongoose.Types.ObjectId(ctx.orderId));
  }

  ticket.priorityScore = priority(ctx);
  await ticket.save();

  const closesInMinutes = Math.max(
    1,
    Math.round((ticket.closesAt.getTime() - now.getTime()) / 60000)
  );

  return {
    batchId: ticket._id.toString(),
    closesAt: ticket.closesAt,
    closesInMinutes,
    priority: ticket.priorityScore,
  };
}

export async function fetchBatchMeta(orderId: string) {
  await connectDb();
  const t = await BatchTicket.findOne({
    orders: new mongoose.Types.ObjectId(orderId),
  });
  
  if (!t) return null;
  const now = Date.now();
   return {
    batchId: t._id.toString(),
    closesAt: t.closesAt,
    closesInMinutes: Math.max(
      1,
      Math.round((t.closesAt.getTime() - now) / 60000)
    ),
    priority: t.priorityScore ?? 0,
  };
}
