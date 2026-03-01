import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { prepareBatchMetadata } from "@engines/batch/batchEngine";
import { reserveStockForOrder } from "@engines/inventory/inventoryEngine";
import { recordMilestone } from "@engines/tracking/trackingEngine";
import { deriveOrderPpi } from "@engines/ppi/ppiEngine";
import { recordPlacement } from "@engines/analytics/analyticsEngine";
import { OrderContext } from "@engines/shared/types";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req:NextRequest) {
    try {
          await connectDb()
        const { userId, items, paymentMethod, totalAmount, address } = await req.json()
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json(
                { message: "please send all credentials" },
                { status: 400 }
            )
        }
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        const newOrder = await Order.create({
            user: userId,
            items,
            paymentMethod,
            totalAmount,
            address
        })

        const ctx: OrderContext = {
            orderId: newOrder._id.toString(),
            userId,
            totalAmount,
            paymentMethod,
            campusZone: address.pincode || address.city || "default",
            vendorId: items?.[0]?.grocery?.toString() || "default",
            address: {
                latitude: address.latitude,
                longitude: address.longitude,
                city: address.city,
                pincode: address.pincode
            },
            items: items.map((i: any) => ({
                groceryId: i.grocery,
                name: i.name,
                unit: i.unit,
                price: Number(i.price),
                quantity: i.quantity,
                image: i.image
            }))
        }

        ctx.ppiScore = await deriveOrderPpi(ctx)
        const batchMeta = await prepareBatchMetadata(ctx)
        await reserveStockForOrder(ctx)
        await recordMilestone(ctx, "order.accepted")
        recordPlacement(ctx, batchMeta)

        const session=await stripe.checkout.sessions.create({
            payment_method_types:["card"],
            mode:"payment",
            success_url:`${process.env.NEXT_BASE_URL}/user/order-success`,
            cancel_url:`${process.env.NEXT_BASE_URL}/user/order-cancel`,
             line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'WHISTLE Order Payment',
          },
          unit_amount:totalAmount*100,
        },
        quantity: 1,
      },
      
    ],
    metadata:{orderId:newOrder._id.toString()}
        })
  
        return NextResponse.json({url:session.url},{status:200})


    } catch (error) {
         return NextResponse.json(
                { message: `order payment error ${error}` },
                { status: 500 }
            )
    }
}
