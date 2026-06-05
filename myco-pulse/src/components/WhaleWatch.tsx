import React, { useState, useEffect } from 'react';
import { Shield, Eye, Clock, Search, Target, Globe, BarChart3, Activity, BrainCircuit, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { getWhaleActivity } from '../services/jupiterSwap';
import { fetchPolymarketWhales } from '../services/apiService';

export const WhaleWatch = () => {
  const [activeTab, setActiveTab] = useState<'BLOCKCHAIN' | 'POLYMARKET' | 'INTELLIGENCE'>('BLOCKCHAIN');
  const [activities, setActivities] = useState<unknown[]>([]);
  const [polyData, setPolyData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFull = async () => {
      const [whaleData, polymarketData] = await Promise.all([getWhaleActivity(), fetchPolymarketWhales()]);
      setActivities(Array.isArray(whaleData) ? whaleData : []);
      setPolyData(Array.isArray(polymarketData) ? polymarketData : []);
      setLoading(false);
    };
    fetchFull();
    const interval = setInterval(fetchFull, 15_000);
    return () => clearInterval(interval);
  }, []);

  const emptyLedger = !loading && activities.length === 0;
  const emptyPoly = !loading && polyData.length === 0;

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden font-mono border border-white/5">
      <div className="p-4 bg-white/[0.02] border-b border-white/5 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center p-1.5 animate-pulse">
              <Target className="size-full text-red-500" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                Whale Watch Protocol
              </h3>
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">
                Active Scanning: MULTI_INDEX
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 h-8">
          {(['BLOCKCHAIN', 'POLYMARKET', 'INTELLIGENCE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 text-[8px] font-black uppercase tracking-tighter flex items-center justify-center gap-1.5 border transition-all',
                activeTab === tab
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-black border-white/5 text-dim hover:bg-white/5'
              )}
            >
              {tab === 'BLOCKCHAIN' && <Activity className="size-3" />}
              {tab === 'POLYMARKET' && <Globe className="size-3" />}
              {tab === 'INTELLIGENCE' && <BrainCircuit className="size-3" />}
              {tab === 'BLOCKCHAIN' ? 'Ledger' : tab === 'POLYMARKET' ? 'Predictions' : 'Intel'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {loading && (
          <div className="flex items-center justify-center h-full gap-2 text-dim text-[10px] uppercase">
            <RefreshCw className="size-4 animate-spin" /> Syncing…
          </div>
        )}

        {!loading && activeTab === 'BLOCKCHAIN' && (
          emptyLedger ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
              <Search className="size-8 text-dim opacity-40" />
              <p className="text-[10px] font-bold text-dim uppercase tracking-widest">
                No on-chain whale index configured
              </p>
              <p className="text-[9px] text-dim max-w-xs">
                Ledger whale tracking requires a MAS/MINDEX indexer endpoint. Polymarket tab may show live gamma API data when reachable.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((row: unknown, i: number) => (
                <div key={i} className="p-3 border border-white/5 text-[9px] text-dim">
                  {JSON.stringify(row)}
                </div>
              ))}
            </div>
          )
        )}

        {!loading && activeTab === 'POLYMARKET' && (
          emptyPoly ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
              <BarChart3 className="size-8 text-dim opacity-40" />
              <p className="text-[10px] font-bold text-dim uppercase tracking-widest">
                Polymarket feed unavailable
              </p>
              <p className="text-[9px] text-dim max-w-xs">
                Browser may block gamma-api.polymarket.com (CORS). Proxy via MYCODAO API can be added later.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {polyData.map((row: unknown, i: number) => (
                <div key={i} className="p-3 border border-white/5 text-[9px] text-white/80">
                  {typeof row === 'object' && row !== null && 'title' in row
                    ? String((row as { title?: string }).title)
                    : JSON.stringify(row)}
                </div>
              ))}
            </div>
          )
        )}

        {!loading && activeTab === 'INTELLIGENCE' && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-6 border border-myco-accent/20 bg-myco-accent/5">
            <Shield className="size-10 text-myco-accent opacity-60" />
            <p className="text-[10px] font-black text-myco-accent uppercase tracking-widest">
              Gemini / neural reports disabled
            </p>
            <p className="text-[9px] text-dim max-w-sm leading-relaxed">
              Intelligence summaries use real data only. Configure MAS_API_URL and PULSE_MAS_PROXY_SECRET for
              /api/pulse/mas-task when automated briefings are ready.
            </p>
            <div className="flex items-center gap-2 text-[8px] text-dim uppercase">
              <Eye className="size-3" />
              <Clock className="size-3" />
              Awaiting production intel pipeline
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
