"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callDemandML = callDemandML;
exports.callPpiML = callPpiML;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = "http://localhost:8000";
async function callDemandML(payload) {
    const { data } = await axios_1.default.post(`${BASE_URL}/ml/demand`, payload, { timeout: 4000 });
    return data;
}
async function callPpiML(payload) {
    const { data } = await axios_1.default.post(`${BASE_URL}/ml/ppi`, payload, { timeout: 4000 });
    return data;
}
