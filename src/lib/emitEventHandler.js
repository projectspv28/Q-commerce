"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function emitEventHandler(event, data, socketId) {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER;
    if (!baseUrl) {
        // Socket server not configured; fail silently
        return;
    }
    try {
        await axios_1.default.post(`${baseUrl}/notify`, { socketId, event, data }, { timeout: 1500 });
    }
    catch (error) {
        // Swallow connection issues so order flow isn’t blocked
        if (error?.code === "ECONNREFUSED") {
            console.warn("socket server unavailable, skipping notify");
        }
        else {
            console.warn("socket notify error", error?.message || error);
        }
    }
}
exports.default = emitEventHandler;
