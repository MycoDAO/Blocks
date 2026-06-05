import React, { useState, useEffect } from 'react';
import { Activity, Clock, Globe, Zap, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchPulseNews, fetchPulseTickers, type PulseNewsItem, type PulseTicker } from '../lib/pulseApi';

function formatChange(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export const CNBCNewsWidget = () => {
  const [index, setIndex] = useState(0);
  const [news, setNews] = useState<PulseNewsItem[]>([]);
  const [indices, setIndices] = useState<PulseTicker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [newsRows, tickers] = await Promise.all([fetchPulseNews(), fetchPulseTickers()]);
      setNews(newsRows);
      setIndices(
        tickers.filter((t) =>
          ['SPY', 'QQQ', 'DXY', 'BTC', 'MYCO', 'SOL'].includes(t.symbol.toUpperCase())
        )
      );
      setLoading(false);
    };
    load();
    const timer = setInterval(load, 120_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!news.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % news.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [news.length]);

  const currentNews = news[index];

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden flex flex-col font-sans select-none">
      <div className="relative flex-1 bg-gradient-to-br from-blue-900/20 via-black to-red-900/10 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="absolute top-6 left-6 z-10 flex flex-col gap-1">
          <div className="bg-blue-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity className="size-3 animate-pulse" /> PULSE NEWS FEED
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 flex flex-col gap-2 min-w-[200px]">
            <div className="flex justify-between items-center text-[9px] font-bold text-dim uppercase">
              <span>Source</span>
              <span>/api/news</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="text-[10px] font-black text-white line-clamp-2">
              {loading
                ? 'Loading…'
                : currentNews
                  ? currentNews.title
                  : 'No news — set GNEWS_API_KEY or NEWS_API_KEY on MYCODAO VM'}
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 h-full w-[20%] bg-[#0a1128]/80 backdrop-blur-xl border-l border-white/5 p-4 flex flex-col gap-6 z-20">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-white tracking-[0.2em] border-b border-white/10 pb-2 mb-4">
              MARKETS NOW
            </h3>
            {indices.length === 0 ? (
              <p className="text-[9px] text-dim uppercase">No tickers — check /api/tickers</p>
            ) : (
              <div className="flex flex-col gap-4">
                {indices.map((idx) => {
                  const up = (idx.changePct ?? 0) >= 0;
                  return (
                    <div key={idx.id} className="flex flex-col border-b border-white/5 pb-2">
                      <span className="text-[9px] font-bold text-dim uppercase">{idx.name}</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black text-white">
                          {idx.price > 0 ? idx.price.toLocaleString() : '—'}
                        </span>
                        <span className={cn('text-[9px] font-bold', up ? 'text-myco-accent' : 'text-red-400')}>
                          {up ? '▲' : '▼'} {formatChange(idx.changePct ?? 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/90 border-t border-white/10 flex items-center px-6 z-30">
          <Globe className="size-4 text-myco-accent mr-4 shrink-0" />
          {currentNews ? (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentNews.title}</p>
              <p className="text-[9px] text-dim uppercase flex items-center gap-2">
                <Clock className="size-3" />
                {currentNews.source} · {new Date(currentNews.publishedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-dim uppercase tracking-widest">
              Configure news API keys on VM for live headlines
            </p>
          )}
          <Monitor className="size-4 text-dim ml-4" />
          <Zap className="size-4 text-myco-accent ml-2" />
        </div>
      </div>
    </div>
  );
};
