/**
 * BLOCKS News live program source (build-time env).
 * Ingest (OBS / Streamlabs → RTMP) is operator-only — never shown in the News UI.
 * Long-term 24/7 channel: Cloudflare Stream Live or Mux + HLS (no third-party player chrome).
 */

const EMBED_HOST = "https://www.youtube-nocookie.com";

export interface NewsLiveConfig {
  embedUrl: string | null;
  streamLabel: string;
  isConfigured: boolean;
}

function readMeta(key: string): string {
  const raw = (import.meta.env[key] as string | undefined)?.trim();
  return raw ?? "";
}

function pick(...keys: string[]): string {
  for (const key of keys) {
    const v = readMeta(key);
    if (v) return v;
  }
  return "";
}

/** Normalize watch / share URLs into https embed paths. */
export function normalizeYoutubeEmbedUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      if (id) return `${EMBED_HOST}/embed/${id}`;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname.startsWith("/embed/")) {
        return `${EMBED_HOST}${url.pathname}`;
      }
      const v = url.searchParams.get("v");
      if (v) return `${EMBED_HOST}/embed/${v}`;
      const liveMatch = url.pathname.match(/^\/live\/([^/]+)/);
      if (liveMatch?.[1]) return `${EMBED_HOST}/embed/${liveMatch[1]}`;
    }
  } catch {
    /* not a URL — fall through */
  }

  if (/^[\w-]{6,}$/.test(trimmed) && !trimmed.includes("/")) {
    return `${EMBED_HOST}/embed/${trimmed}`;
  }

  return trimmed.startsWith("http") ? trimmed : "";
}

function withLiveParams(embedBase: string): string {
  try {
    const url = new URL(embedBase);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "0");
    url.searchParams.set("controls", "0");
    url.searchParams.set("modestbranding", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("iv_load_policy", "3");
    url.searchParams.set("disablekb", "1");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("fs", "0");
    url.searchParams.set("color", "white");
    return url.toString();
  } catch {
    const sep = embedBase.includes("?") ? "&" : "?";
    return `${embedBase}${sep}autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`;
  }
}

export function resolveNewsLiveEmbedUrl(): string | null {
  const direct = pick(
    "VITE_PULSE_NEWS_VIDEO_EMBED_URL",
    "NEXT_PUBLIC_PULSE_NEWS_VIDEO_EMBED_URL",
    "VITE_PULSE_NEWS_YOUTUBE_EMBED_URL",
    "NEXT_PUBLIC_PULSE_NEWS_YOUTUBE_EMBED_URL",
  );
  if (direct) {
    const normalized = normalizeYoutubeEmbedUrl(direct);
    return normalized ? withLiveParams(normalized) : null;
  }

  const channelId = pick(
    "VITE_PULSE_NEWS_YOUTUBE_CHANNEL_ID",
    "NEXT_PUBLIC_PULSE_NEWS_YOUTUBE_CHANNEL_ID",
  );
  if (channelId) {
    return withLiveParams(
      `${EMBED_HOST}/embed/live_stream?channel=${encodeURIComponent(channelId)}`,
    );
  }

  const videoId = pick(
    "VITE_PULSE_NEWS_YOUTUBE_VIDEO_ID",
    "NEXT_PUBLIC_PULSE_NEWS_YOUTUBE_VIDEO_ID",
  );
  if (videoId) {
    return withLiveParams(`${EMBED_HOST}/embed/${encodeURIComponent(videoId)}`);
  }

  return null;
}

export function getNewsLiveConfig(): NewsLiveConfig {
  const embedUrl = resolveNewsLiveEmbedUrl();
  const streamLabel =
    pick("VITE_PULSE_NEWS_STREAM_LABEL", "NEXT_PUBLIC_PULSE_NEWS_STREAM_LABEL") ||
    "MycoDAO News";

  return {
    embedUrl,
    streamLabel,
    isConfigured: Boolean(embedUrl),
  };
}
