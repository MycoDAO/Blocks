import { pulseApiUrl } from "./apiOrigin";
import { getValidProducerAccessToken } from "./producerSession";

export type TissueCategory = "mushroom" | "mold" | "mildew" | "yeast";
export type TissueVisibility = "public" | "internal" | "hidden";
export type TissueMediaKind = "image" | "video" | "stream";

export interface TissueTaxonomy {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

export interface TissueMediaItem {
  id: string;
  nasPath: string;
  kind: TissueMediaKind;
  liveStreamUrl: string | null;
  isCover: boolean;
  sortOrder: number;
  visibility: TissueVisibility;
  serveUrl: string;
}

export interface TissueSample {
  id: string;
  sampleId: string;
  commonName: string;
  scientificName: string;
  category: TissueCategory;
  taxonomy: TissueTaxonomy;
  mindexTaxonId: string | null;
  massValue: number | null;
  massUnit: "g" | "mg" | null;
  massLabel: string | null;
  storageLocation: string | null;
  collectedAt: string | null;
  description: string | null;
  visibility: TissueVisibility;
  coverServeUrl: string | null;
  media: TissueMediaItem[];
}

export interface TissueNasAsset {
  id: string;
  relPath: string;
  fileName: string;
  kind: "video" | "graphic";
  serveUrl: string;
}

async function curatorHeaders(): Promise<HeadersInit> {
  const token = await getValidProducerAccessToken();
  if (!token) throw new Error("not_signed_in");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchPublicTissueCatalog(opts?: {
  category?: TissueCategory | "all";
  search?: string;
}): Promise<TissueSample[]> {
  const params = new URLSearchParams();
  if (opts?.category && opts.category !== "all") {
    params.set("category", opts.category);
  }
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  const qs = params.toString();
  const res = await fetch(pulseApiUrl(`/api/tissue${qs ? `?${qs}` : ""}`), {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`tissue ${res.status}`);
  const data = (await res.json()) as { samples?: TissueSample[] };
  return data.samples ?? [];
}

export async function fetchCuratorTissueCatalog(opts?: {
  category?: TissueCategory | "all";
  search?: string;
}): Promise<TissueSample[]> {
  const params = new URLSearchParams();
  if (opts?.category && opts.category !== "all") {
    params.set("category", opts.category);
  }
  if (opts?.search?.trim()) params.set("search", opts.search.trim());
  const qs = params.toString();
  const res = await fetch(
    pulseApiUrl(`/api/tissue/admin${qs ? `?${qs}` : ""}`),
    { headers: await curatorHeaders(), cache: "no-store" },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `admin tissue ${res.status}`);
  }
  const data = (await res.json()) as { samples?: TissueSample[] };
  return data.samples ?? [];
}

export async function createTissueSample(input: {
  sampleId: string;
  commonName: string;
  scientificName: string;
  category: TissueCategory;
  taxonomy?: TissueTaxonomy;
  massValue?: number | null;
  massUnit?: "g" | "mg" | null;
  storageLocation?: string | null;
  collectedAt?: string | null;
  description?: string | null;
  visibility?: TissueVisibility;
  enrichFromMindex?: boolean;
}): Promise<TissueSample> {
  const res = await fetch(pulseApiUrl("/api/tissue/admin"), {
    method: "POST",
    headers: await curatorHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `create ${res.status}`);
  }
  const data = (await res.json()) as { sample: TissueSample };
  return data.sample;
}

export async function updateTissueSample(
  id: string,
  patch: Record<string, unknown>,
): Promise<TissueSample> {
  const res = await fetch(pulseApiUrl(`/api/tissue/admin/${id}`), {
    method: "PATCH",
    headers: await curatorHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `update ${res.status}`);
  }
  const data = (await res.json()) as { sample: TissueSample };
  return data.sample;
}

export async function attachTissueMedia(
  sampleUuid: string,
  input: {
    nasPath: string;
    kind: TissueMediaKind;
    isCover?: boolean;
    sortOrder?: number;
    visibility?: TissueVisibility;
    liveStreamUrl?: string | null;
  },
): Promise<TissueMediaItem> {
  const res = await fetch(pulseApiUrl(`/api/tissue/admin/${sampleUuid}/media`), {
    method: "POST",
    headers: await curatorHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `attach media ${res.status}`);
  }
  const data = (await res.json()) as { media: TissueMediaItem };
  return data.media;
}

export async function patchTissueMedia(input: {
  mediaId: string;
  visibility?: TissueVisibility;
  isCover?: boolean;
  sortOrder?: number;
}): Promise<TissueMediaItem> {
  const res = await fetch(pulseApiUrl("/api/tissue/admin/media"), {
    method: "PATCH",
    headers: await curatorHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `patch media ${res.status}`);
  }
  const data = (await res.json()) as { media: TissueMediaItem };
  return data.media;
}

export async function deleteTissueMedia(mediaId: string): Promise<void> {
  const res = await fetch(pulseApiUrl("/api/tissue/admin/media"), {
    method: "DELETE",
    headers: await curatorHeaders(),
    body: JSON.stringify({ mediaId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `delete media ${res.status}`);
  }
}

export async function fetchTissueNasAssets(
  sampleId?: string,
): Promise<TissueNasAsset[]> {
  const params = sampleId ? `?sampleId=${encodeURIComponent(sampleId)}` : "";
  const res = await fetch(
    pulseApiUrl(`/api/tissue/admin/media-browser${params}`),
    { headers: await curatorHeaders(), cache: "no-store" },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `nas browser ${res.status}`);
  }
  const data = (await res.json()) as {
    assets?: Array<{
      id: string;
      relPath: string;
      fileName: string;
      kind: "video" | "graphic";
      serveUrl: string;
    }>;
  };
  return (data.assets ?? []).map((a) => ({
    id: a.id,
    relPath: a.relPath,
    fileName: a.fileName,
    kind: a.kind,
    serveUrl: a.serveUrl,
  }));
}
