import { NextResponse } from "next/server";
import { resolveTaxonomyFromMindex } from "@/lib/adapters/tissue-taxonomy";
import {
  createTissueSample,
  listAllTissueSamples,
  type TissueCategory,
  type TissueVisibility,
} from "@/lib/server/tissue-catalog";
import {
  producerAuthErrorMessage,
  verifyTissueCuratorAuth,
} from "@/lib/server/tissue-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = new Set(["mushroom", "mold", "mildew", "yeast"]);
const VISIBILITY = new Set(["public", "internal", "hidden"]);

function authFailure(auth: Awaited<ReturnType<typeof verifyTissueCuratorAuth>>) {
  if (auth.ok) return null;
  const status =
    auth.reason === "auth_unconfigured"
      ? 503
      : auth.reason === "auth_upstream_error"
        ? 502
        : 401;
  return NextResponse.json(
    { error: producerAuthErrorMessage(auth), reason: auth.reason },
    { status },
  );
}

export async function GET(req: Request) {
  const auth = await verifyTissueCuratorAuth(req);
  const denied = authFailure(auth);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const categoryRaw = searchParams.get("category")?.trim();
    const search = searchParams.get("search")?.trim() ?? undefined;
    const category =
      categoryRaw && CATEGORIES.has(categoryRaw)
        ? (categoryRaw as TissueCategory)
        : undefined;

    const samples = await listAllTissueSamples({ category, search });
    return NextResponse.json(
      { samples, count: samples.length },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (e) {
    console.error("tissue/admin GET:", e);
    return NextResponse.json(
      { error: "tissue_admin_list_failed", detail: String(e) },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const auth = await verifyTissueCuratorAuth(req);
  if (!auth.ok) {
    const denied = authFailure(auth);
    return denied ?? NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const category = String(body.category ?? "").trim();
    if (!CATEGORIES.has(category)) {
      return NextResponse.json({ error: "invalid_category" }, { status: 400 });
    }

    const sampleId = String(body.sampleId ?? "").trim();
    const commonName = String(body.commonName ?? "").trim();
    const scientificName = String(body.scientificName ?? "").trim();
    if (!sampleId || !commonName || !scientificName) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }

    let taxonomy =
      body.taxonomy && typeof body.taxonomy === "object"
        ? (body.taxonomy as Record<string, string>)
        : {};
    let mindexTaxonId =
      typeof body.mindexTaxonId === "string" ? body.mindexTaxonId.trim() : null;

    if (body.enrichFromMindex === true && scientificName) {
      const hint = await resolveTaxonomyFromMindex(scientificName);
      if (hint) {
        taxonomy = { ...taxonomy, ...hint.taxonomy };
        mindexTaxonId = hint.mindexTaxonId ?? mindexTaxonId;
      }
    }

    const visibilityRaw = String(body.visibility ?? "internal").trim();
    const visibility = VISIBILITY.has(visibilityRaw)
      ? (visibilityRaw as TissueVisibility)
      : "internal";

    const massUnitRaw = body.massUnit != null ? String(body.massUnit).trim() : null;
    const massUnit =
      massUnitRaw === "g" || massUnitRaw === "mg" ? massUnitRaw : null;

    const sample = await createTissueSample({
      sampleId,
      commonName,
      scientificName,
      category: category as TissueCategory,
      taxonomy,
      mindexTaxonId,
      massValue:
        body.massValue != null && body.massValue !== ""
          ? Number(body.massValue)
          : null,
      massUnit,
      storageLocation:
        typeof body.storageLocation === "string"
          ? body.storageLocation.trim()
          : null,
      collectedAt:
        typeof body.collectedAt === "string" ? body.collectedAt : null,
      description:
        typeof body.description === "string" ? body.description.trim() : null,
      visibility,
      createdBy: auth.email,
    });

    return NextResponse.json({ sample }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json({ error: "sample_id_exists" }, { status: 409 });
    }
    console.error("tissue/admin POST:", e);
    return NextResponse.json(
      { error: "tissue_create_failed", detail: message },
      { status: 503 },
    );
  }
}
