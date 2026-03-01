"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreGroceries = void 0;
exports.deriveOrderPpi = deriveOrderPpi;
const db_1 = __importDefault(require("../../../../src/lib/db"));
const grocery_model_1 = __importDefault(require("../../../../src/models/grocery.model"));
const categoryWeights = {
    "Fruits & Vegetables": 92,
    "Dairy & Eggs": 78,
    "Rice, Atta & Grains": 74,
    "Snacks & Biscuits": 55,
    "Spices & Masalas": 70,
    "Beverages & Drinks": 60,
    "Personal Care": 52,
    "Household Essentials": 68,
    "Instant & Packaged Food": 50,
    "Baby & Pet Care": 65,
};
const scoreGroceries = (list) => list.map((g) => ({
    ...g,
    ppiScore: Math.min(100, Math.round(categoryWeights[g.category || ""] || 60)),
}));
exports.scoreGroceries = scoreGroceries;
async function deriveOrderPpi(ctx) {
    await (0, db_1.default)();
    const cats = await grocery_model_1.default.find({
        _id: { $in: ctx.items.map((i) => i.groceryId) },
    })
        .select("category")
        .lean();
    const map = Object.fromEntries(cats.map((c) => [c._id.toString(), c.category]));
    const scores = ctx.items.map((i) => categoryWeights[map[i.groceryId] || ""] || 60);
    return Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
}
