import { NextResponse } from "next/server";
import { fetchFundingBundle } from "@/lib/adapters/funding";

export async function GET() {
  try {
    const bundle = await fetchFundingBundle();
    return NextResponse.json(bundle);
  } catch (e) {
    console.error("funding route:", e);
    return NextResponse.json({ error: "funding_unavailable", detail: String(e) }, { status: 503 });
  }
}
