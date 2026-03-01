import { NextRequest, NextResponse } from "next/server";
import { aiConciergeSuggest } from "@engines/ai/concierge";

export async function POST(req: NextRequest) {
    try {
        const { message, role } = await req.json()
        const suggestions = await aiConciergeSuggest(message, role)
        return NextResponse.json(
            suggestions,{status:200}
        )

    } catch (error) {
        return NextResponse.json(
            {message:`concierge error ${error}`},{status:500}
        )
    }
}
