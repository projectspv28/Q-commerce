import { getAvailabilityMap } from "../../engines/inventory/inventoryEngine";
import {
  recordMigration,
  recentMigrations as migrationLogRecent,
} from "../../engines/inventory/migrationLog";

const sanitizeMove = (payload) => ({
  groceryId: payload?.groceryId,
  fromLocation: payload?.fromLocation || payload?.from || "UNKNOWN",
  toLocation: payload?.toLocation || payload?.to || "UNKNOWN",
  quantity: Number(payload?.quantity || 0),
  operatorId: payload?.operatorId,
  note: payload?.note,
});

export async function migrateLocation(payload) {
  const move = sanitizeMove(payload);
  if (!move.groceryId || !move.fromLocation || !move.toLocation) {
    throw new Error("invalid_move_payload");
  }
  if (move.quantity <= 0) throw new Error("invalid_quantity");

  const availability = await getAvailabilityMap([move.groceryId]);
  const expected = availability[move.groceryId]?.available ?? 0;

  if (move.quantity > expected) {
    throw new Error("insufficient_available_stock");
  }

  const entry = recordMigration({
    groceryId: move.groceryId,
    fromLocation: move.fromLocation,
    toLocation: move.toLocation,
    quantity: move.quantity,
    operatorId: move.operatorId,
    note: move.note,
  });

  return {
    ...entry,
    availableBefore: expected,
  };
}

export const recentMigrations = (limit = 20) => migrationLogRecent(limit);
