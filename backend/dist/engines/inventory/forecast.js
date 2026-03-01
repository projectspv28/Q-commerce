"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeVelocity = computeVelocity;
exports.forecastRunoutAt = forecastRunoutAt;
exports.getFastMovers = getFastMovers;
const db_1 = __importDefault(require("../../../lib/db"));
const mongoose_1 = __importDefault(require("mongoose"));
const stockSchema = new mongoose_1.default.Schema({
    groceryId: String,
    available: { type: Number, default: 50 },
    reserved: { type: Number, default: 0 },
    soldOut: { type: Boolean, default: false },
}, { timestamps: true });
const reservationSchema = new mongoose_1.default.Schema({
    orderId: mongoose_1.default.Schema.Types.ObjectId,
    items: [
        {
            groceryId: String,
            quantity: Number,
            status: { type: String, enum: ["reserved", "deducted"] },
        },
    ],
}, { timestamps: true });
const InventoryStock = mongoose_1.default.models.InventoryStock ||
    mongoose_1.default.model("InventoryStock", stockSchema);
const InventoryReservation = mongoose_1.default.models.InventoryReservation ||
    mongoose_1.default.model("InventoryReservation", reservationSchema);
const hoursAgo = (hrs) => new Date(Date.now() - hrs * 3600000);
async function computeVelocity(groceryId, lookbackHours = 24) {
    await (0, db_1.default)();
    const since = hoursAgo(lookbackHours);
    const reservations = await InventoryReservation.find({
        createdAt: { $gte: since },
        "items.groceryId": groceryId,
    })
        .select("items createdAt")
        .lean();
    let qty = 0;
    reservations.forEach((r) => {
        r.items?.forEach((i) => {
            if (i.groceryId === groceryId)
                qty += Number(i.quantity || 0);
        });
    });
    const velocityPerHour = Number((qty / Math.max(1, lookbackHours)).toFixed(2));
    return { groceryId, velocityPerHour, samples: reservations.length };
}
async function forecastRunoutAt(groceryId, lookbackHours = 24) {
    await (0, db_1.default)();
    const stock = await InventoryStock.findOne({ groceryId }).lean();
    if (!stock)
        return null;
    const { velocityPerHour } = await computeVelocity(groceryId, lookbackHours);
    const available = Math.max(0, (stock.available || 0) - (stock.reserved || 0));
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
async function getFastMovers(limit = 10, lookbackHours = 24) {
    await (0, db_1.default)();
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
    const rows = await InventoryReservation.aggregate(pipeline);
    return rows.map((r) => ({
        groceryId: r._id,
        totalReserved: r.qty,
        orders: r.count,
        velocityPerHour: Number((r.qty / Math.max(1, lookbackHours)).toFixed(2)),
    }));
}
