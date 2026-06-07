import { NextResponse } from "next/server";
import { resolveNewsProgramNow } from "@/lib/server/news-channel-program";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const program = resolveNewsProgramNow();
    return NextResponse.json(program, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("news/program:", e);
    return NextResponse.json(
      { error: "program_unavailable", detail: String(e) },
      { status: 503 },
    );
  }
}
