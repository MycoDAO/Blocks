import { pulseApiUrl } from "./apiOrigin";

const DEFAULT_PRODUCER_OAUTH_REDIRECT =
  "https://blocks.mycodao.com/blocks/?producer=1";

let cachedRedirect: string | null = null;

/** Never send OAuth back to mycosoft.com (shared Supabase Site URL). */
export async function resolveProducerOAuthRedirect(): Promise<string> {
  if (cachedRedirect) return cachedRedirect;

  const buildTime = (
    import.meta.env.VITE_PRODUCER_OAUTH_REDIRECT as string | undefined
  )?.trim();
  if (buildTime) {
    cachedRedirect = buildTime;
    return buildTime;
  }

  try {
    const res = await fetch(pulseApiUrl("/api/pulse/public-config"), {
      cache: "no-store",
    });
    if (res.ok) {
      const cfg = (await res.json()) as { producerOAuthRedirect?: string };
      const fromServer = cfg.producerOAuthRedirect?.trim();
      if (fromServer) {
        cachedRedirect = fromServer;
        return fromServer;
      }
    }
  } catch {
    /* use fallback */
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      cachedRedirect = `${origin.replace(/\/$/, "")}/blocks/?producer=1`;
      return cachedRedirect;
    }
    if (hostname.endsWith("mycodao.com")) {
      const base =
        hostname === "blocks.mycodao.com"
          ? "https://blocks.mycodao.com"
          : origin.replace(/\/$/, "");
      cachedRedirect = `${base}/blocks/?producer=1`;
      return cachedRedirect;
    }
  }

  cachedRedirect = DEFAULT_PRODUCER_OAUTH_REDIRECT;
  return cachedRedirect;
}
