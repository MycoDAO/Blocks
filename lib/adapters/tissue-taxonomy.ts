import { mindexApiBase, mindexInternalHeaders } from "@/lib/server/pulse-env";

export interface TissueTaxonomyRanks {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

export interface MindexTaxonHint {
  mindexTaxonId: string | null;
  scientificName: string | null;
  taxonomy: TissueTaxonomyRanks;
}

/** Optional MINDEX enrich — returns null when MINDEX is unreachable or query empty. */
export async function resolveTaxonomyFromMindex(
  scientificName: string,
): Promise<MindexTaxonHint | null> {
  const base = mindexApiBase();
  const q = scientificName?.trim();
  if (!base || !q) return null;

  const url = `${base}/api/v1/taxonomy/search?q=${encodeURIComponent(q)}&limit=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...mindexInternalHeaders() },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        id?: string;
        scientific_name?: string;
        taxonomy?: Record<string, string>;
      }>;
    };
    const hit = data.results?.[0];
    if (!hit) return null;

    const tax = hit.taxonomy ?? {};
    return {
      mindexTaxonId: hit.id?.trim() || null,
      scientificName: hit.scientific_name?.trim() || q,
      taxonomy: {
        kingdom: tax.kingdom,
        phylum: tax.phylum,
        class: tax.class,
        order: tax.order,
        family: tax.family,
        genus: tax.genus,
        species: tax.species,
      },
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
