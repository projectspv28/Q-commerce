import { getAvailabilityMap } from "../../engines/inventory/inventoryEngine";
import { computeVariance } from "../../engines/inventory/audit";

const normalizeLines = (lines) =>
  Array.isArray(lines)
    ? lines.filter((l) => l?.groceryId).map((l) => ({
        groceryId: l.groceryId,
        physical: Number(l.physical ?? l.physicalCount ?? 0),
        location: l.location || "default",
      }))
    : [];

export async function runAudit(lines = [], metadata = {}) {
  const auditLines = normalizeLines(lines);
  if (!auditLines.length) {
    return {
      auditedAt: new Date(),
      totals: { skuCount: 0, matched: 0, short: 0, over: 0, netVariance: 0 },
      lines: [],
      metadata,
    };
  }

  const expectedMap = await getAvailabilityMap(
    auditLines.map((l) => l.groceryId)
  );

  const linesWithExpected = auditLines.map((l) => ({
    ...l,
    expected: expectedMap[l.groceryId]?.available ?? 0,
  }));

  return { ...computeVariance(linesWithExpected), metadata };
}
