import { NextResponse } from "next/server";
import { resolveTaxonomyFromMindex } from "@/lib/adapters/tissue-taxonomy";
import {
  updateTissueSample,
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await verifyTissueCuratorAuth(req);
  const denied = authFailure(auth);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;

    let taxonomy =
      body.taxonomy && typeof body.taxonomy === "object"
        ? (body.taxonomy as Record<string, string>)
        : undefined;

    let mindexTaxonId =
      body.mindexTaxonId !== undefined
        ? typeof body.mindexTaxonId === "string"
          ? body.mindexTaxonId.trim() || null
          : null
        : undefined;

    const scientificName =
      typeof body.scientificName === "string"
        ? body.scientificName.trim()
        : undefined;

    if (body.enrichFromMindex === true && scientificName) {
      const hint = await resolveTaxonomyFromMindex(scientificName);
      if (hint) {
        taxonomy = { ...(taxonomy ?? {}), ...hint.taxonomy };
        mindexTaxonId = hint.mindexTaxonId ?? mindexTaxonId ?? null;
      }
    }

    const categoryRaw =
      body.category !== undefined ? String(body.category).trim() : undefined;
    if (categoryRaw && !CATEGORIES.has(categoryRaw)) {
      return NextResponse.json({ error: "invalid_category" }, { status: 400 });
    }

    const visibilityRaw =
      body.visibility !== undefined ? String(body.visibility).trim() : undefined;
    if (visibilityRaw && !VISIBILITY.has(visibilityRaw)) {
      return NextResponse.json({ error: "invalid_visibility" }, { status: 400 });
    }

    const massUnitRaw =
      body.massUnit !== undefined && body.massUnit !== null
        ? String(body.massUnit).trim()
        : undefined;
    if (massUnitRaw && massUnitRaw !== "g" && massUnitRaw !== "mg") {
      return NextResponse.json({ error: "invalid_mass_unit" }, { status: 400 });
    }

    const sample = await updateTissueSample(id, {
      commonName:
        typeof body.commonName === "string" ? body.commonName.trim() : undefined,
      scientificName,
      category: categoryRaw as TissueCategory | undefined,
      taxonomy,
      mindexTaxonId,
      massValue:
        body.massValue !== undefined
          ? body.massValue === null || body.massValue === ""
            ? null
            : Number(body.massValue)
          : undefined,
      massUnit:
        massUnitRaw === "g" || massUnitRaw === "mg"
          ? massUnitRaw
          : massUnitRaw === undefined
            ? undefined
            : null,
      storageLocation:
        typeof body.storageLocation === "string"
          ? body.storageLocation.trim()
          : body.storageLocation === null
            ? null
            : undefined,
      collectedAt:
        typeof body.collectedAt === "string"
          ? body.collectedAt
          : body.collectedAt === null
            ? null
            : undefined,
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : body.description === null
            ? null
            : undefined,
      visibility: visibilityRaw as TissueVisibility | undefined,
      coverMediaId:
        typeof body.coverMediaId === "string"
          ? body.coverMediaId
          : body.coverMediaId === null
            ? null
            : undefined,
    });

    if (!sample) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ sample });
  } catch (e) {
    console.error("tissue/admin/[id] PATCH:", e);
    return NextResponse.json(
      { error: "tissue_update_failed", detail: String(e) },
      { status: 503 },
    );
  }
}
