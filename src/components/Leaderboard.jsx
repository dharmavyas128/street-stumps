import { useState, useEffect } from 'react';
import { ChevronLeft, GitCompare, X, Trophy, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../leaderboard';
import LeaderboardTable from './LeaderboardTable';
import CompareModal from './CompareModal';

export default function Leaderboard({ onBack }) {
  const [players, setPlayers] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let on = true;
    getLeaderboard()
      .then((res) => {
        if (!on) return;
        setPlayers(res.players);
        setIsDemo(res.isDemo);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, []);

  const toggleSelect = (id) => {
    setSelectedPlayers((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= 2) return sel;
      return [...sel, id];
    });
  };

  const enterCompare = () => {
    setIsCompareMode((on) => {
      if (on) setSelectedPlayers([]);
      return !on;
    });
  };

  const selected = selectedPlayers.map((id) => players.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className={`animate-pop-in ${selected.length === 2 ? 'pb-24' : ''}`}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300">
          <ChevronLeft size={18} />
          Home
        </button>
        <button
          onClick={enterCompare}
          className={`btn-press flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
            isCompareMode ? 'border-neon/40 bg-neon/15 text-neon' : 'border-white/10 bg-white/5 text-slate-300'
          }`}
        >
          <GitCompare size={14} />
          {isCompareMode ? 'Comparing' : 'Compare'}
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2 px-1">
        <Trophy size={20} className="text-neon" />
        <h2 className="text-lg font-bold text-white">Leaderboard</h2>
        {isDemo && (
          <span className="ml-auto rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Sample data
          </span>
        )}
      </div>
      {isDemo && (
        <p className="mb-3 px-1 text-[11px] text-slate-500">
          Showing sample players — your real career stats appear here once you've saved a few games.
        </p>
      )}
      {isCompareMode && (
        <p className="mb-2 px-1 text-[11px] text-neon">Pick 2 players to compare ({selected.length}/2).</p>
      )}

      {loading ? (
        <div className="glass flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-neon" />
          Crunching the numbers…
        </div>
      ) : (
        <LeaderboardTable
          players={players}
          compareMode={isCompareMode}
          selectedIds={selectedPlayers}
          onToggleSelect={toggleSelect}
        />
      )}

      {selected.length === 2 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-midnight/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
            <div className="flex-1 truncate text-sm text-slate-300">
              <span className="font-bold text-neon">{selected[0].name}</span>
              <span className="mx-1.5 text-slate-500">vs</span>
              <span className="font-bold text-alert">{selected[1].name}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-press flex items-center gap-1.5 rounded-xl bg-neon px-4 py-2.5 text-sm font-bold text-midnight shadow-glow-green"
            >
              <GitCompare size={15} />
              Compare
            </button>
            <button
              onClick={() => setSelectedPlayers([])}
              aria-label="Clear selection"
              className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showModal && selected.length === 2 && (
        <CompareModal p1={selected[0]} p2={selected[1]} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
