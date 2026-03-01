"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMigration = recordMigration;
exports.recentMigrations = recentMigrations;
const log = [];
const MAX_LOG = 100;
function recordMigration(entry) {
    const row = { ...entry, movedAt: new Date() };
    log.unshift(row);
    if (log.length > MAX_LOG)
        log.pop();
    return row;
}
function recentMigrations(limit = 20) {
    return log.slice(0, limit);
}
