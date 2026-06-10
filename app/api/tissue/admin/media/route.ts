import { NextResponse } from "next/server";
import {
  deleteTissueMedia,
  updateTissueMedia,
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

export async function PATCH(req: Request) {
  const auth = await verifyTissueCuratorAuth(req);
  const denied = authFailure(auth);
  if (denied) return denied;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const mediaId = String(body.mediaId ?? "").trim();
    if (!mediaId) {
      return NextResponse.json({ error: "missing_media_id" }, { status: 400 });
    }

    const visibilityRaw =
      body.visibility !== undefined ? String(body.visibility).trim() : undefined;
    if (visibilityRaw && !VISIBILITY.has(visibilityRaw)) {
      return NextResponse.json({ error: "invalid_visibility" }, { status: 400 });
    }

    const kindRaw =
      body.kind !== undefined ? String(body.kind).trim() : undefined;
    if (kindRaw && !KINDS.has(kindRaw)) {
      return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
    }

    const media = await updateTissueMedia(mediaId, {
      visibility: visibilityRaw as TissueVisibility | undefined,
      isCover:
        body.isCover === true ? true : body.isCover === false ? false : undefined,
      sortOrder:
        body.sortOrder != null ? Number(body.sortOrder) : undefined,
      kind: kindRaw as TissueMediaKind | undefined,
      liveStreamUrl:
        body.liveStreamUrl !== undefined
          ? typeof body.liveStreamUrl === "string"
            ? body.liveStreamUrl.trim() || null
            : null
          : undefined,
    });

    if (!media) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ media });
  } catch (e) {
    console.error("tissue/admin/media PATCH:", e);
    return NextResponse.json(
      { error: "tissue_media_update_failed", detail: String(e) },
      { status: 503 },
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await verifyTissueCuratorAuth(req);
  const denied = authFailure(auth);
  if (denied) return denied;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const mediaId = String(body.mediaId ?? "").trim();
    if (!mediaId) {
      return NextResponse.json({ error: "missing_media_id" }, { status: 400 });
    }
    await deleteTissueMedia(mediaId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("tissue/admin/media DELETE:", e);
    return NextResponse.json(
      { error: "tissue_media_delete_failed", detail: String(e) },
      { status: 503 },
    );
  }
}
