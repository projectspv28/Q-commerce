"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const grocerySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            "Fruits & Vegetables",
            "Dairy & Eggs",
            "Rice, Atta & Grains",
            "Snacks & Biscuits",
            "Spices & Masalas",
            "Beverages & Drinks",
            "Personal Care",
            "Household Essentials",
            "Instant & Packaged Food",
            "Baby & Pet Care"
        ],
        required: true
    },
    price: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true,
        enum: [
            "kg", "g", "liter", "ml", "piece", "pack"
        ]
    },
    image: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
const Grocery = mongoose_1.default.models.Grocery || mongoose_1.default.model("Grocery", grocerySchema);
exports.default = Grocery;
