type MoveEntry = {
  groceryId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  operatorId?: string;
  note?: string;
  movedAt: Date;
};

const log: MoveEntry[] = [];
const MAX_LOG = 100;

export function recordMigration(entry: Omit<MoveEntry, "movedAt">) {
  const row: MoveEntry = { ...entry, movedAt: new Date() };
  log.unshift(row);
  if (log.length > MAX_LOG) log.pop();
  return row;
}

export function recentMigrations(limit = 20) {
  return log.slice(0, limit);
}
