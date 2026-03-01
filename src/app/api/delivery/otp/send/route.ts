import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
       await connectDb() 
       const {orderId}=await req.json()
       const order=await Order.findById(orderId).populate("user")
       if(!order){
        return NextResponse.json(
            {message:"order not found"},
            {status:400}
        )
       }

       const otp=Math.floor(1000+Math.random()*9000).toString()
       order.deliveryOtp=otp
       await order.save()

       await sendMail(
        order.user.email,
        "Your Delivery OTP",
        `<h2>Your Delivery OTP is <strong>${otp}</strong></h2>`
    )
     return NextResponse.json(
            {message:"otp sent successfully"},
            {status:200}
        )

    } catch (error) {
         return NextResponse.json(
            {message:`send otp error ${error}`},
            {status:500}
        )
    }
}