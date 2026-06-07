/**
 * BLOCK Funding bundle — MycoDAO pipeline catalog + live treasury/governance metrics.
 */

import type { FundingBundle, ResearchHubFeedItem } from "@/lib/types";
import { fetchMycoSnapshot } from "@/lib/adapters/myco";
import { fetchResearchHubPopular, isResearchHubConfigured } from "@/lib/adapters/researchhub";

const MYCO_REALMS_PK = "At93fiCMzEkZWBAHxSNjfk7zUHnF3JcxyCyPjZELjK9Y";

async function fetchRealmsProposalCount(): Promise<number | null> {
  const base = process.env.REALMS_API_URL?.trim() || "https://v2.realms.today/api/v1";
  try {
    const url = `${base.replace(/\/$/, "")}/daos/${MYCO_REALMS_PK}/proposals?limit=1`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { total?: number; results?: unknown[] };
    if (typeof data.total === "number") return data.total;
    if (Array.isArray(data.results)) return data.results.length;
    return null;
  } catch {
    return null;
  }
}

export async function fetchFundingBundle(): Promise<FundingBundle> {
  const [myco, researchHubPapers, proposalCount] = await Promise.all([
    fetchMycoSnapshot(),
    fetchResearchHubPopular(12),
    fetchRealmsProposalCount(),
  ]);

  const rf = myco.researchFunding;
  const gov = myco.governance;
  const biobank = myco.biobank;

  const stats = {
    grantPoolMyco: rf?.grantPoolMyco ?? 0,
    grantsDeployedMyco: rf?.grantsDeployedMyco ?? 0,
    activeProposals: proposalCount ?? gov?.activeProposals ?? rf?.activeProposals ?? 0,
    activeResearchProjects: rf?.activeResearchProjects ?? 0,
    samplesIndexed: biobank?.samplesIndexed ?? rf?.samplesIndexed ?? 0,
    treasuryLiquidityUsd: myco.liquidityUsd ?? 0,
    mycoPrice: myco.price ?? 0,
  };

  const researchHubConfigured = isResearchHubConfigured();

  return {
    stats,
    researchHub: {
      configured: researchHubConfigured,
      papers: researchHubPapers as ResearchHubFeedItem[],
      portalUrl: "https://www.researchhub.com/popular",
      docsUrl: "https://docs.researchhub.com/",
    },
    updatedAt: new Date().toISOString(),
  };
}
