import connectDb from "../../../../src/lib/db";
import Grocery from "../../../../src/models/grocery.model";
import { OrderContext } from "../shared/types";

const categoryWeights: Record<string, number> = {
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

export const scoreGroceries = <T extends { category?: string; _id?: any }>(
  list: T[]
) =>
  list.map((g) => ({
    ...g,
    ppiScore: Math.min(100, Math.round(categoryWeights[g.category || ""] || 60)),
  }));

export async function deriveOrderPpi(ctx: OrderContext) {
  await connectDb();
  const cats = await Grocery.find({
    _id: { $in: ctx.items.map((i) => i.groceryId) },
  })
    .select("category")
    .lean();
  const map = Object.fromEntries(
    cats.map((c: any) => [c._id.toString(), c.category])
  );
  const scores = ctx.items.map(
    (i) => categoryWeights[map[i.groceryId] || ""] || 60
  );
  return Math.round(
    scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)
  );
}
