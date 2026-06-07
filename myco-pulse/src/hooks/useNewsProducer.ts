import { useCallback, useEffect, useState } from "react";
import { pulseApiUrl } from "../lib/apiOrigin";

export interface BroadcastTalentLine {
  name: string;
  roles: string[];
  creditLine?: string;
}

export interface ProducerPresetOption {
  id: string;
  label: string;
}

export interface ProducerProgramOption extends ProducerPresetOption {
  type: string;
  hasSource: boolean;
}

export interface NewsProducerView {
  updatedAt: string;
  talent: BroadcastTalentLine[];
  talentPresetId: string | null;
  talentPresetLabel: string | null;
  programMode: string;
  programLabel: string | null;
  programEmbedUrl: string | null;
  programMediaUrl: string | null;
  programGraphicUrl: string | null;
  programNasPath: string | null;
  programSourceType: string;
  activeProgramPresetId: string | null;
  activeGraphicNasPath: string | null;
  presets?: {
    talent: ProducerPresetOption[];
    program: ProducerProgramOption[];
  };
}

const POLL_MS = 5_000;
const STORAGE_KEY = "blocks-news-producer-key";

export function getStoredProducerKey(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setStoredProducerKey(key: string): void {
  try {
    if (key.trim()) sessionStorage.setItem(STORAGE_KEY, key.trim());
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useNewsProducer(options?: { includePresets?: boolean }) {
  const [view, setView] = useState<NewsProducerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(pulseApiUrl("/api/news/producer"), {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`producer ${res.status}`);
      const data = (await res.json()) as NewsProducerView;
      setView(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "producer fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await load();
      if (cancelled) return;
    };
    void run();
    const t = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [load]);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      const key = getStoredProducerKey();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (key) headers["x-news-producer-key"] = key;

      const res = await fetch(pulseApiUrl("/api/news/producer"), {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? `patch ${res.status}`,
        );
      }

      const data = (await res.json()) as { view?: NewsProducerView };
      if (data.view) setView(data.view);
      else await load();
      return data;
    },
    [load],
  );

  const talent = view?.talent ?? [];
  const presets = options?.includePresets ? view?.presets : undefined;

  return {
    view,
    talent,
    presets,
    loading,
    error,
    reload: load,
    patch,
  };
}
