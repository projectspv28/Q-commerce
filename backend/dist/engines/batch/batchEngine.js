"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareBatchMetadata = prepareBatchMetadata;
exports.fetchBatchMeta = fetchBatchMeta;
const db_1 = __importDefault(require("../../../../src/lib/db"));
const mongoose_1 = __importDefault(require("mongoose"));
const batchSchema = new mongoose_1.default.Schema({
    batchKey: String,
    vendorId: String,
    campusZone: String,
    closesAt: Date,
    orders: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Order" }],
    priorityScore: Number,
}, { timestamps: true });
const BatchTicket = mongoose_1.default.models.BatchTicket || mongoose_1.default.model("BatchTicket", batchSchema);
const WINDOW_MINUTES = 8;
const priority = (ctx) => Number((1 + (ctx.ppiScore || 0) / 100 + ctx.totalAmount / 5000).toFixed(2));
async function prepareBatchMetadata(ctx) {
    await (0, db_1.default)();
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
    if (!ticket.orders.find((o) => o.toString() === ctx.orderId.toString())) {
        ticket.orders.push(new mongoose_1.default.Types.ObjectId(ctx.orderId));
    }
    ticket.priorityScore = priority(ctx);
    await ticket.save();
    const closesInMinutes = Math.max(1, Math.round((ticket.closesAt.getTime() - now.getTime()) / 60000));
    return {
        batchId: ticket._id.toString(),
        closesAt: ticket.closesAt,
        closesInMinutes,
        priority: ticket.priorityScore,
    };
}
async function fetchBatchMeta(orderId) {
    await (0, db_1.default)();
    const t = await BatchTicket.findOne({
        orders: new mongoose_1.default.Types.ObjectId(orderId),
    });
    if (!t)
        return null;
    const now = Date.now();
    return {
        batchId: t._id.toString(),
        closesAt: t.closesAt,
        closesInMinutes: Math.max(1, Math.round((t.closesAt.getTime() - now) / 60000)),
        priority: t.priorityScore ?? 0,
    };
}
