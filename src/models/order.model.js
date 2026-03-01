"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const orderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            grocery: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Grocery",
                required: true
            },
            name: String,
            price: String,
            unit: String,
            image: String,
            quantity: Number
        }
    ],
    paymentMethod: {
        type: String,
        enum: ["cod", "online"],
        default: "cod"
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    totalAmount: Number,
    address: {
        fullName: String,
        mobile: String,
        city: String,
        state: String,
        pincode: String,
        fullAddress: String,
        latitude: Number,
        longitude: Number
    },
    assignment: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "DeliveryAssignment",
        default: null
    },
    assignedDeliveryBoy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ["pending", "out of delivery", "delivered"],
        default: "pending"
    },
    deliveryOtp: {
        type: String,
        default: null
    },
    deliveryOtpVerification: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    }
}, { timestamps: true });
const Order = mongoose_1.default.models.Order || mongoose_1.default.model("Order", orderSchema);
exports.default = Order;
