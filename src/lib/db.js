"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodbUrl = process.env.MONGODB_URL;
if (!mongodbUrl) {
    throw new Error("db error");
}
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}
const connectDb = async () => {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(mongodbUrl).then((conn) => conn.connection);
    }
    try {
        const conn = await cached.promise;
        return conn;
    }
    catch (error) {
        console.log(error);
    }
};
exports.default = connectDb;
