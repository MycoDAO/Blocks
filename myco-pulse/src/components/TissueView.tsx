import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  Dna,
  Loader2,
  Microscope,
  RefreshCw,
  Search,
  Video,
} from "lucide-react";
import { cn } from "../lib/utils";
import { pulseApiUrl } from "../lib/apiOrigin";
import {
  fetchPublicTissueCatalog,
  type TissueCategory,
  type TissueSample,
} from "../lib/tissueApi";
import { TissueCuratorPanel } from "./TissueCuratorPanel";

type CategoryFilter = "all" | TissueCategory;

const CATEGORY_CHIPS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mushroom", label: "Mushrooms" },
  { id: "mold", label: "Mold" },
  { id: "mildew", label: "Mildew" },
  { id: "yeast", label: "Yeast" },
];

const RANK_ORDER = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
] as const;

function useCurateRoute(): boolean {
  const [curate, setCurate] = useState(false);
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setCurate(params.get("curate") === "1");
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return curate;
}

function mediaServeUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : pulseApiUrl(url);
}

function TissueCard({
  sample,
  expanded,
  onToggle,
}: {
  sample: TissueSample;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cover = mediaServeUrl(sample.coverServeUrl);

  return (
    <motion.article
      layout
      className={cn(
        "glass-bento border-white/10 bg-black/50 overflow-hidden flex flex-col touch-manipulation",
        expanded && "col-span-1 sm:col-span-2 lg:col-span-3",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="text-left w-full group min-h-[44px]"
        aria-expanded={expanded}
      >
        <div className="relative aspect-square overflow-hidden bg-black/80">
          {cover ? (
            <img
              src={cover}
              alt={sample.commonName}
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-dim">
              <Microscope className="size-10 opacity-40" aria-hidden />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-black/70 border border-myco-accent/40 text-myco-accent">
              {sample.sampleId}
            </span>
            {sample.massLabel ? (
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-black/70 border border-white/20 text-white/80">
                {sample.massLabel}
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <p className="text-sm sm:text-base font-black uppercase text-white leading-tight">
              {sample.commonName}
            </p>
            <p className="text-[10px] sm:text-xs italic text-white/65 mt-0.5">
              {sample.scientificName}
            </p>
          </div>
          <span className="absolute top-2 right-2 p-2 text-white/70">
            <ChevronDown
              className={cn("size-4 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {sample.description ? (
                <p className="text-xs text-white/70 leading-relaxed">
                  {sample.description}
                </p>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                {RANK_ORDER.map((rank) => {
                  const value = sample.taxonomy[rank];
                  if (!value) return null;
                  return (
                    <div
                      key={rank}
                      className="border border-white/10 bg-black/40 px-2 py-1.5"
                    >
                      <p className="text-[8px] uppercase text-dim tracking-widest">
                        {rank}
                      </p>
                      <p className="text-white/85 font-medium truncate">{value}</p>
                    </div>
                  );
                })}
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-white/65">
                {sample.storageLocation ? (
                  <div>
                    <dt className="text-dim uppercase tracking-widest">Storage</dt>
                    <dd>{sample.storageLocation}</dd>
                  </div>
                ) : null}
                {sample.collectedAt ? (
                  <div>
                    <dt className="text-dim uppercase tracking-widest">Collected</dt>
                    <dd>{new Date(sample.collectedAt).toLocaleString()}</dd>
                  </div>
                ) : null}
                {sample.mindexTaxonId ? (
                  <div>
                    <dt className="text-dim uppercase tracking-widest">MINDEX</dt>
                    <dd className="font-mono text-[9px]">{sample.mindexTaxonId}</dd>
                  </div>
                ) : null}
              </dl>

              {sample.media.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-dim">
                    Media
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sample.media.map((m) => {
                      const src = mediaServeUrl(m.serveUrl);
                      if (m.kind === "video" && src) {
                        return (
                          <video
                            key={m.id}
                            src={src}
                            controls
                            className="aspect-square w-full object-cover bg-black border border-white/10"
                          />
                        );
                      }
                      if (m.kind === "stream" && m.liveStreamUrl) {
                        return (
                          <a
                            key={m.id}
                            href={m.liveStreamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square flex flex-col items-center justify-center gap-1 border border-amber-400/40 bg-amber-400/10 text-amber-200 min-h-[44px] touch-manipulation"
                          >
                            <Video className="size-5" aria-hidden />
                            <span className="text-[8px] font-bold uppercase">Live feed</span>
                          </a>
                        );
                      }
                      return src ? (
                        <img
                          key={m.id}
                          src={src}
                          alt=""
                          className="aspect-square w-full object-cover border border-white/10"
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-dim italic">
                  Live camera feeds will appear here when configured.
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

export function TissueView() {
  const curateMode = useCurateRoute();
  const [samples, setSamples] = useState<TissueSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPublicTissueCatalog({
        category,
        search: search.trim() || undefined,
      });
      setSamples(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tissue catalog");
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    if (!curateMode) void load();
  }, [curateMode, load]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading…";
    return `${samples.length} public sample${samples.length === 1 ? "" : "s"}`;
  }, [loading, samples.length]);

  if (curateMode) {
    return <TissueCuratorPanel onExitCatalog={() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("curate");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }} />;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-h-0 flex-1 overflow-y-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-myco-accent flex items-center gap-2">
            <Dna className="size-4" aria-hidden />
            MycoDAO Biobank
          </p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white mt-1">
            Tissue Catalog
          </h1>
          <p className="text-xs text-dim mt-2 max-w-xl">
            Stored fungal tissue — mushrooms, mold, mildew, and yeast — with taxonomy,
            sample IDs, mass, and high-definition imagery from the NAS vault.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="min-h-[44px] px-4 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-dim hover:text-white touch-manipulation disabled:opacity-50 inline-flex items-center gap-2"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <a
            href="?curate=1"
            className="min-h-[44px] px-4 border border-myco-accent/40 text-[10px] font-bold uppercase tracking-widest text-myco-accent hover:bg-myco-accent/10 touch-manipulation inline-flex items-center"
          >
            Curator
          </a>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dim" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, species, sample ID…"
            className="w-full pl-10 pr-4 py-3 min-h-[44px] text-base bg-black/50 border border-white/10 text-white placeholder:text-dim"
          />
        </div>
        <p className="text-[10px] text-dim uppercase tracking-widest shrink-0">
          {countLabel}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setCategory(chip.id)}
            className={cn(
              "min-h-[44px] px-4 text-[10px] font-bold uppercase tracking-widest border touch-manipulation",
              category === chip.id
                ? "border-myco-accent bg-myco-accent/15 text-myco-accent"
                : "border-white/15 text-dim hover:text-white",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-dim gap-2">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-xs uppercase tracking-widest">Loading catalog…</span>
        </div>
      ) : samples.length === 0 ? (
        <div className="glass-bento border-white/10 p-8 sm:p-12 text-center">
          <Microscope className="size-12 mx-auto text-dim/50 mb-4" aria-hidden />
          <p className="text-lg font-bold text-white uppercase">No public samples yet</p>
          <p className="text-sm text-dim mt-2 max-w-md mx-auto">
            The tissue vault is empty for public visitors. Authorized curators can add
            samples at{" "}
            <a href="?curate=1" className="text-myco-accent underline">
              ?curate=1
            </a>
            .
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          {samples.map((sample) => (
            <TissueCard
              key={sample.id}
              sample={sample}
              expanded={expandedId === sample.id}
              onToggle={() =>
                setExpandedId((id) => (id === sample.id ? null : sample.id))
              }
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
