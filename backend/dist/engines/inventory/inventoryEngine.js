"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveStockForOrder = reserveStockForOrder;
exports.deductStockOnDelivery = deductStockOnDelivery;
exports.getAvailabilityMap = getAvailabilityMap;
const db_1 = __importDefault(require("../../../../src/lib/db"));
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
async function refreshSoldOutFlags() {
    const stocks = await InventoryStock.find({});
    await Promise.all(stocks.map((s) => InventoryStock.updateOne({ _id: s._id }, { $set: { soldOut: (s.available || 0) - (s.reserved || 0) <= 0 } })));
}
async function reserveStockForOrder(ctx) {
    await (0, db_1.default)();
    const shortfalls = [];
    for (const item of ctx.items) {
        const stock = await InventoryStock.findOneAndUpdate({ groceryId: item.groceryId }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
        if ((stock.available || 0) - (stock.reserved || 0) < item.quantity) {
            shortfalls.push(item.name || item.groceryId);
        }
    }
    if (shortfalls.length)
        throw new Error(`sold_out:${shortfalls.join(",")}`);
    await Promise.all(ctx.items.map((i) => InventoryStock.updateOne({ groceryId: i.groceryId }, { $inc: { reserved: i.quantity }, $set: { soldOut: false } })));
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
async function deductStockOnDelivery(orderId) {
    await (0, db_1.default)();
    const res = await InventoryReservation.findOne({ orderId });
    if (!res)
        return;
    for (const i of res.items) {
        await InventoryStock.updateOne({ groceryId: i.groceryId }, { $inc: { available: -i.quantity, reserved: -i.quantity } });
        i.status = "deducted";
    }
    res.markModified("items");
    await res.save();
    await refreshSoldOutFlags();
}
async function getAvailabilityMap(ids) {
    await (0, db_1.default)();
    const stocks = await InventoryStock.find({ groceryId: { $in: ids } }).lean();
    return stocks.reduce((acc, s) => {
        acc[s.groceryId] = {
            soldOut: s.soldOut,
            available: Math.max(0, (s.available || 0) - (s.reserved || 0)),
        };
        return acc;
    }, {});
}
