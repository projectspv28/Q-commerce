import { NextResponse } from "next/server";
import { getTimeline } from "@engines/tracking/trackingEngine";

export async function GET(
  _: any,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const snapshot = await getTimeline(orderId);
  return NextResponse.json(snapshot, { status: 200 });
}
