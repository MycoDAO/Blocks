import { NextResponse } from "next/server";
import {
  listPublicTissueSamples,
  type TissueCategory,
} from "@/lib/server/tissue-catalog";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["mushroom", "mold", "mildew", "yeast"]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryRaw = searchParams.get("category")?.trim();
    const search = searchParams.get("search")?.trim() ?? undefined;
    const category =
      categoryRaw && CATEGORIES.has(categoryRaw)
        ? (categoryRaw as TissueCategory)
        : undefined;

    const samples = await listPublicTissueSamples({ category, search });
    return NextResponse.json(
      { samples, count: samples.length },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === "supabase_unconfigured") {
      return NextResponse.json(
        { error: "tissue_catalog_unconfigured", samples: [], count: 0 },
        { status: 503 },
      );
    }
    console.error("tissue GET:", e);
    return NextResponse.json(
      { error: "tissue_list_failed", detail: message },
      { status: 503 },
    );
  }
}
