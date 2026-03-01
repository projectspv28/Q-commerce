import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { recordMilestone } from "@engines/tracking/trackingEngine";
import { recordDeliveryAnalytics } from "@engines/analytics/analyticsEngine";
import { stat } from "fs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest, context: { params: Promise<{ orderId: string; }>; }) {
    try {
        await connectDb()
        const {orderId}=await context.params
        const {status}=await req.json()
        const order=await Order.findById(orderId).populate("user")
        if(!order){
            return NextResponse.json(
                {message:"order not found"},
                {status:400}
            )
        }
        order.status=status
        const ctx = {
            orderId: order._id.toString(),
            userId: order.user?.toString?.(),
            campusZone: order.address?.pincode || order.address?.city || "default",
            vendorId: order.items?.[0]?.grocery?.toString() || "default",
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            address: {
                latitude: order.address.latitude,
                longitude: order.address.longitude
            },
            items: order.items?.map((i: any) => ({
                groceryId: i.grocery,
                name: i.name,
                unit: i.unit,
                price: Number(i.price),
                quantity: i.quantity
            }))
        }
        if(status==="out of delivery"){
            await recordMilestone(ctx as any,"packed")
            await recordMilestone(ctx as any,"picked")
        }
        let deliveryBoysPayload:any=[]
        if(status==="out of delivery" && !order.assignment){
            const {latitude,longitude}=order.address
            const nearByDeliveryBoys=await User.find({
                role:"deliveryBoy",
                location:{
                    $near:{
                        $geometry:{type:"Point",coordinates:[Number(longitude),Number(latitude)]},
                        $maxDistance:10000
                    }
                }
            })
            const nearByIds=nearByDeliveryBoys.map((b)=>b._id)
            const busyIds=await DeliveryAssignment.find({
                assignedTo:{$in:nearByIds},
                status:{$nin:["brodcasted", "completed"]}
            }).distinct("assignedTo")
            const busyIdSet=new Set(busyIds.map(b=>String(b)))
            const availableDeliveryBoys=nearByDeliveryBoys.filter(
                b=>!busyIdSet.has(String(b._id))
            )
             const candidates=availableDeliveryBoys.map(b=>b._id)

             if(candidates.length==0){
                await order.save()
            
                await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})

                return NextResponse.json(
                {message:"there is no available Delivery boys"},
                {status:200}
            )
             }
   
             const deliveryAssignment=await DeliveryAssignment.create({
                order:order._id,
                brodcastedTo:candidates,
                status:"brodcasted"
             })

             await deliveryAssignment.populate("order");
             for(const boyId of candidates){
                const boy=await User.findById(boyId)
                if(boy.socketId){
                    await emitEventHandler("new-assignment",deliveryAssignment,boy.socketId)
                }
             }

            
             order.assignment=deliveryAssignment._id
            deliveryBoysPayload=availableDeliveryBoys.map(b=>({
                id:b._id,
                name:b.name,
                mobile:b.mobile,
                latitude:b.location.coordinates[1],
                longitude:b.location.coordinates[0]
            }))
            await deliveryAssignment.populate("order")
            
        }

        await order.save()
        recordDeliveryAnalytics()
        await order.populate("user")
      await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})
        return NextResponse.json({
            assignment:order.assignment?._id,
            availableBoys:deliveryBoysPayload
        },{status:200})

    } catch (error) {
         return NextResponse.json({
           message:`update status error ${error}`
        },{status:500})
    }
}
