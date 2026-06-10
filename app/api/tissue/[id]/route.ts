import { NextResponse } from "next/server";
import { getPublicTissueSample } from "@/lib/server/tissue-catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const sample = await getPublicTissueSample(id);
    if (!sample) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(
      { sample },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === "supabase_unconfigured") {
      return NextResponse.json(
        { error: "tissue_catalog_unconfigured" },
        { status: 503 },
      );
    }
    console.error("tissue/[id] GET:", e);
    return NextResponse.json(
      { error: "tissue_detail_failed", detail: message },
      { status: 503 },
    );
  }
}
