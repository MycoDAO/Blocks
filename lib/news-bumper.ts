/**
 * Default full-bleed idle frame when producer is off-air and no scheduled program plays.
 * Served as static asset at /blocks/broadcast/news-idle-bumper.png (Pulse build).
 */
export const NEWS_IDLE_BUMPER_PATH = "/blocks/broadcast/news-idle-bumper.png";

export function newsIdleBumperUrl(): string {
  return NEWS_IDLE_BUMPER_PATH;
}
