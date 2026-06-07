import { NextResponse } from "next/server";
import {
  blocksNasConfigPublic,
  scanBlocksNasLibrary,
} from "@/lib/server/blocks-nas-media";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { status, assets } = scanBlocksNasLibrary();
    return NextResponse.json(
      {
        status,
        assets,
        config: blocksNasConfigPublic(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (e) {
    console.error("news/producer/media GET:", e);
    return NextResponse.json(
      { error: "media_scan_failed", detail: String(e) },
      { status: 503 },
    );
  }
}
