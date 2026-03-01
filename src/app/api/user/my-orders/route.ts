import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { fetchBatchMeta } from "@engines/batch/batchEngine";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) {
    try {
        await connectDb()
        const session=await auth()
        const orders=await Order.find({user:session?.user?.id}).populate("user assignedDeliveryBoy").sort({createdAt:-1})
        if(!orders){
            return NextResponse.json({message:"orders not found"},{status:400})
        }
        const enriched=await Promise.all(
            orders.map(async(o)=>({
                ...o.toObject(),
                batchMeta: await fetchBatchMeta(o._id.toString())
            }))
        )
        return NextResponse.json(enriched,{status:200})
        
    } catch (error) {
        return NextResponse.json({message:`get all orders error:${error}`},{status:500})
    }
}
