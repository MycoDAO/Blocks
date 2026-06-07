import { NextResponse } from "next/server";
import { fetchResearchHubPopular, isResearchHubConfigured, researchHubApiBase } from "@/lib/adapters/researchhub";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    40,
    Math.max(8, parseInt(searchParams.get("limit") || "24", 10) || 24)
  );

  try {
    const papers = await fetchResearchHubPopular(limit);
    return NextResponse.json({
      papers,
      configured: isResearchHubConfigured(),
      apiBase: researchHubApiBase(),
      portalUrl: "https://www.researchhub.com/popular",
      docsUrl: "https://docs.researchhub.com/",
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("researchhub route:", e);
    return NextResponse.json(
      {
        papers: [],
        configured: isResearchHubConfigured(),
        apiBase: researchHubApiBase(),
        error: "researchhub_unavailable",
        portalUrl: "https://www.researchhub.com/popular",
        docsUrl: "https://docs.researchhub.com/",
      },
      { status: 503 }
    );
  }
}
