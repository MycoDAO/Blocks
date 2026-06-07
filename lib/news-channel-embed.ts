/** Shared YouTube → privacy-enhanced embed URL (server + docs). */

const EMBED_HOST = "https://www.youtube-nocookie.com";

export function normalizeYoutubeEmbedPath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

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
        return `${EMBED_HOST}${url.pathname.split("?")[0]}`;
      }
      const v = url.searchParams.get("v");
      if (v) return `${EMBED_HOST}/embed/${v}`;
      const liveMatch = url.pathname.match(/^\/live\/([^/]+)/);
      if (liveMatch?.[1]) return `${EMBED_HOST}/embed/${liveMatch[1]}`;
    }
  } catch {
    /* fall through */
  }

  if (/^[\w-]{6,}$/.test(trimmed) && !trimmed.includes("/")) {
    return `${EMBED_HOST}/embed/${trimmed}`;
  }

  return trimmed.startsWith("http") ? trimmed : null;
}

export function withNewsPlayerParams(embedBase: string): string {
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
    return url.toString();
  } catch {
    const sep = embedBase.includes("?") ? "&" : "?";
    return `${embedBase}${sep}autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`;
  }
}

export function buildYoutubeEmbedFromSource(source: {
  videoId?: string;
  videoUrl?: string;
  channelId?: string;
}): string | null {
  if (source.channelId?.trim()) {
    return withNewsPlayerParams(
      `${EMBED_HOST}/embed/live_stream?channel=${encodeURIComponent(source.channelId.trim())}`,
    );
  }

  const raw = source.videoUrl?.trim() || source.videoId?.trim();
  if (!raw) return null;

  const path = source.videoUrl?.trim()
    ? normalizeYoutubeEmbedPath(source.videoUrl)
    : `${EMBED_HOST}/embed/${source.videoId!.trim()}`;

  return path ? withNewsPlayerParams(path) : null;
}
