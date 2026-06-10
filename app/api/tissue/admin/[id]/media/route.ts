import { NextResponse } from "next/server";
import {
  attachTissueMedia,
  type TissueMediaKind,
  type TissueVisibility,
} from "@/lib/server/tissue-catalog";
import {
  producerAuthErrorMessage,
  verifyTissueCuratorAuth,
} from "@/lib/server/tissue-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KINDS = new Set(["image", "video", "stream"]);
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await verifyTissueCuratorAuth(req);
  const denied = authFailure(auth);
  if (denied) return denied;

  try {
    const { id: sampleUuid } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;
    const nasPath = String(body.nasPath ?? "").trim();
    const kindRaw = String(body.kind ?? "image").trim();
    if (!nasPath) {
      return NextResponse.json({ error: "missing_nas_path" }, { status: 400 });
    }
    if (!KINDS.has(kindRaw)) {
      return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
    }

    const visibilityRaw = String(body.visibility ?? "internal").trim();
    const visibility = VISIBILITY.has(visibilityRaw)
      ? (visibilityRaw as TissueVisibility)
      : "internal";

    const media = await attachTissueMedia(sampleUuid, {
      nasPath,
      kind: kindRaw as TissueMediaKind,
      liveStreamUrl:
        typeof body.liveStreamUrl === "string"
          ? body.liveStreamUrl.trim() || null
          : null,
      isCover: body.isCover === true,
      sortOrder:
        body.sortOrder != null ? Number(body.sortOrder) : undefined,
      visibility,
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (e) {
    console.error("tissue/admin/[id]/media POST:", e);
    return NextResponse.json(
      { error: "tissue_media_attach_failed", detail: String(e) },
      { status: 503 },
    );
  }
}

