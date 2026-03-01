import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import { deductStockOnDelivery } from "@engines/inventory/inventoryEngine";
import { recordMilestone } from "@engines/tracking/trackingEngine";
import { recordDeliveryAnalytics } from "@engines/analytics/analyticsEngine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await connectDb()
       const {orderId,otp}=await req.json() 
       if(!orderId || !otp){
        return NextResponse.json(
                    {message:"orderId or OTP not found"},
                    {status:400}
                )
       }

       const order=await Order.findById(orderId)
       if(!order){
        return NextResponse.json(
                    {message:"order not found"},
                    {status:400}
                )
       }

       if(order.deliveryOtp!==otp){
         return NextResponse.json(
                    {message:"Incorrect or expired Otp"},
                    {status:400}
                )
       }

    order.status="delivered"
    order.deliveryOtpVerification=true
    order.deliveredAt=new Date()
    await order.save()
    await deductStockOnDelivery(orderId)
    await recordMilestone({
        orderId,
        userId: order.user?.toString?.(),
        campusZone: order.address?.pincode || "default",
        vendorId: order.items?.[0]?.grocery?.toString() || "default",
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        address:{
            latitude:order.address.latitude,
            longitude:order.address.longitude
        },
        items: order.items?.map((i:any)=>({
            groceryId:i.grocery,
            name:i.name,
            unit:i.unit,
            price:Number(i.price),
            quantity:i.quantity
        }))
    } as any,"delivered")
    recordDeliveryAnalytics()
await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})
    await DeliveryAssignment.updateOne(
        {order:orderId},
        {$set:{assignedTo:null,status:"completed"}}
    )
 return NextResponse.json(
                    {message:"Delivery successfully completed"},
                    {status:200}
                )


    } catch (error) {
         return NextResponse.json(
                    {message:`verify otp error ${error}`},
                    {status:500}
                )
    }
}
