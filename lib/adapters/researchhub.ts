/**

 * ResearchHub feed — fungal / mycology scoped papers.

 * Configure RESEARCHHUB_API_BASE on the MYCODAO VM for live Django API search.

 */



import type { ResearchHubFeedItem } from "@/lib/types";

import {

  FUNGAL_RESEARCHHUB_QUERIES,

  matchesFungalResearch,

  stripHtml,

} from "@/lib/fungal-research";



const DEFAULT_HEADERS = {

  Accept: "application/json",

  "User-Agent": "MycoDAO-BLOCKS/1.0 (https://blocks.mycodao.com; contact@mycosoft.com)",

};



const DEFAULT_RESEARCHHUB_API_BASE = "https://api.researchhub.com";

export function researchHubApiBase(): string {
  const raw = process.env.RESEARCHHUB_API_BASE?.trim();
  return (raw || DEFAULT_RESEARCHHUB_API_BASE).replace(/\/$/, "");
}

export function isResearchHubConfigured(): boolean {
  return Boolean(researchHubApiBase());
}



function mapFeedResult(item: Record<string, unknown>, i: number): ResearchHubFeedItem | null {

  const unified =

    (item.unified_document as Record<string, unknown> | undefined) ??

    (item.document as Record<string, unknown> | undefined) ??

    item;



  const title = stripHtml(

    String(unified.title ?? unified.document_title ?? item.title ?? "").trim()

  );

  if (!title) return null;



  const hub =

    (unified.hubs as Array<{ name?: string }> | undefined)?.[0]?.name ??

    (item.hub as { name?: string } | undefined)?.name;



  if (!matchesFungalResearch(title, hub, String(unified.plain_text ?? ""))) return null;



  const id = String(unified.id ?? unified.document_id ?? item.id ?? `rh-${i}`);

  const slug = unified.slug ? String(unified.slug) : "";

  const score =

    typeof item.score === "number"

      ? item.score

      : typeof unified.score === "number"

        ? unified.score

        : undefined;



  const created =

    String(

      unified.created_date ?? unified.paper_publish_date ?? item.created_date ?? ""

    ) || undefined;



  const url = slug

    ? `https://www.researchhub.com/paper/${slug}`

    : id.startsWith("http")

      ? id

      : `https://www.researchhub.com/paper/${id.replace(/^RH:/i, "")}`;



  const authors = Array.isArray(unified.authors)

    ? (unified.authors as Array<{ author_name?: string; full_name?: string }>)

        .map((a) => a.author_name || a.full_name)

        .filter(Boolean)

        .slice(0, 4)

        .join(", ")

    : undefined;



  const fundraise = item.fundraise as Record<string, unknown> | undefined;

  const fundingGoal =

    typeof fundraise?.goal_amount === "number" ? fundraise.goal_amount : undefined;

  const fundingRaised =

    typeof fundraise?.amount_raised === "number" ? fundraise.amount_raised : undefined;



  return {

    id,

    title,

    hub,

    authors,

    score,

    fundingGoal,

    fundingRaised,

    url,

    publishedAt: created,

    needsFunding: Boolean(fundingGoal || fundingRaised || item.grant),

  };

}



function researchHubPaperUrl(doc: Record<string, unknown>, id: string): string {
  const slug = doc.slug ? String(doc.slug) : "";
  if (slug) return `https://www.researchhub.com/paper/${slug}`;

  const unifiedId = doc.unified_document_id;
  if (unifiedId != null && String(unifiedId)) {
    return `https://www.researchhub.com/paper/${String(unifiedId)}`;
  }

  const doi = doc.doi ? String(doc.doi) : "";
  if (doi.startsWith("http")) return doi;

  return `https://www.researchhub.com/paper/${id.replace(/^RH:/i, "")}`;
}

function mapSearchDocument(doc: Record<string, unknown>, i: number): ResearchHubFeedItem | null {

  const title = stripHtml(String(doc.title ?? doc.paper_title ?? doc.document_title ?? "").trim());

  if (!title) return null;



  const hubs = doc.hubs as Array<{ name?: string }> | undefined;

  const hub = hubs?.[0]?.name ?? (doc.hub as { name?: string } | undefined)?.name;

  const snippet = String(doc.snippet ?? doc.plain_text ?? doc.abstract ?? doc.renderable_text ?? "");



  if (!matchesFungalResearch(title, hub, snippet)) return null;



  const id = String(doc.id ?? doc.document_id ?? `rh-search-${i}`);

  const url = researchHubPaperUrl(doc, id);



  const authors = Array.isArray(doc.authors)

    ? (doc.authors as Array<{ author_name?: string; full_name?: string; first_name?: string; last_name?: string }>)

        .map((a) => a.author_name || a.full_name || [a.first_name, a.last_name].filter(Boolean).join(" "))

        .filter(Boolean)

        .slice(0, 4)

        .join(", ")

    : undefined;

  const summary = stripHtml(snippet).slice(0, 280);



  return {

    id,

    title,

    hub,

    authors: authors || (summary ? summary : undefined),

    url,

    publishedAt: String(doc.created_date ?? doc.paper_publish_date ?? "") || undefined,

    needsFunding: Boolean(doc.grant ?? doc.fundraise),

  };

}



function extractRows(data: unknown): Record<string, unknown>[] {

  if (Array.isArray(data)) return data as Record<string, unknown>[];

  if (!data || typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.results)) return obj.results as Record<string, unknown>[];

  if (Array.isArray(obj.documents)) return obj.documents as Record<string, unknown>[];

  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];

  return [];

}



async function fetchResearchHubPath(

  path: string,

  limit: number

): Promise<ResearchHubFeedItem[]> {

  const base = researchHubApiBase();

  if (!base) return [];



  const url = `${base}${path}${path.includes("?") ? "&" : "?"}page_size=${limit}`;

  const res = await fetch(url, {

    headers: DEFAULT_HEADERS,

    cache: "no-store",

    signal: AbortSignal.timeout(14_000),

  });

  if (!res.ok) return [];



  const data = await res.json();

  const rows = extractRows(data);

  const out: ResearchHubFeedItem[] = [];

  let i = 0;

  for (const row of rows) {

    const mapped = mapFeedResult(row, i++) ?? mapSearchDocument(row, i++);

    if (mapped) out.push(mapped);

    if (out.length >= limit) break;

  }

  return out;

}



async function fetchResearchHubSearch(query: string, limit: number): Promise<ResearchHubFeedItem[]> {

  const base = researchHubApiBase();

  if (!base) return [];



  const url = `${base}/api/search/?q=${encodeURIComponent(query)}&page_size=${limit}&sort=relevance`;

  const res = await fetch(url, {

    headers: DEFAULT_HEADERS,

    cache: "no-store",

    signal: AbortSignal.timeout(14_000),

  });

  if (!res.ok) return [];



  const data = await res.json();

  const rows = extractRows(data);

  const out: ResearchHubFeedItem[] = [];

  let i = 0;

  for (const row of rows) {

    const mapped = mapSearchDocument(row, i++) ?? mapFeedResult(row, i++);

    if (mapped) out.push(mapped);

    if (out.length >= limit) break;

  }

  return out;

}



function dedupePapers(items: ResearchHubFeedItem[]): ResearchHubFeedItem[] {

  const seen = new Set<string>();

  const out: ResearchHubFeedItem[] = [];

  for (const item of items) {

    const key = item.id || item.url;

    if (seen.has(key)) continue;

    seen.add(key);

    out.push(item);

  }

  return out;

}



/** Fungal-scoped ResearchHub papers (search + filtered feeds). */

export async function fetchResearchHubPopular(limit = 24): Promise<ResearchHubFeedItem[]> {

  const capped = Math.min(40, Math.max(8, limit));

  const base = researchHubApiBase();

  if (!base) return [];



  const collected: ResearchHubFeedItem[] = [];

  const perQuery = Math.max(6, Math.ceil(capped / FUNGAL_RESEARCHHUB_QUERIES.length));



  for (const query of FUNGAL_RESEARCHHUB_QUERIES) {

    try {

      const rows = await fetchResearchHubSearch(query, perQuery);

      collected.push(...rows);

    } catch {

      /* next query */

    }

    if (dedupePapers(collected).length >= capped) break;

  }



  if (dedupePapers(collected).length < capped) {

    const feedPaths = ["/api/feed/popular/", "/api/feed/?feed_view=popular", "/api/funding_feed/"];

    for (const path of feedPaths) {

      try {

        const rows = await fetchResearchHubPath(path, capped);

        collected.push(...rows);

      } catch {

        /* try next */

      }

      if (dedupePapers(collected).length >= capped) break;

    }

  }



  return dedupePapers(collected).slice(0, capped);

}


