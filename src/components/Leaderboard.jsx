import { useState, useEffect } from 'react';
import { ChevronLeft, GitCompare, X, Trophy, Loader2, Info } from 'lucide-react';
import { getLeaderboard } from '../leaderboard';
import LeaderboardTable from './LeaderboardTable';
import CompareModal from './CompareModal';

const BATTING_RULES = [
  { event: 'Each run scored', pts: '+1' },
  { event: 'Boundary bonus (4)', pts: '+1' },
  { event: 'Boundary bonus (6)', pts: '+2' },
  { event: 'Thirty bonus (30–49 runs)', pts: '+10' },
  { event: 'Half-century bonus (50–99 runs)', pts: '+20' },
  { event: 'Century bonus (100+ runs)', pts: '+30' },
  { event: 'Duck (dismissed for 0)', pts: '−3', negative: true },
];

const BOWLING_RULES = [
  { event: 'Each wicket', pts: '+20' },
  { event: 'Maiden over', pts: '+12' },
  { event: 'Dot ball', pts: '+0.5' },
  { event: '3-wicket haul', pts: '+10' },
  { event: '4-wicket haul', pts: '+15' },
  { event: '5-wicket haul', pts: '+25' },
  { event: 'Wide', pts: '−1', negative: true },
  { event: 'No-ball', pts: '−1', negative: true },
];

const FIELDING_RULES = [
  { event: 'Catch', pts: '+10' },
  { event: 'Run-out', pts: '+10' },
  { event: 'Stumping', pts: '+12' },
];

function RulesSheet({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-[#0d1117] animate-pop-in" style={{ maxHeight: '88dvh' }}>
        {/* Pinned header */}
        <div className="shrink-0 px-5 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Points System</h3>
            <button
              onClick={onClose}
              className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-8">
          <div className="space-y-5">
            <RulesSection title="Batting" color="neon" rows={BATTING_RULES} note="Milestone bonus applies to your highest score only." />
            <RulesSection title="Bowling" color="crimson" rows={BOWLING_RULES} note="Haul bonus applies to the highest wicket tier only." />
            <RulesSection title="Fielding" color="alert" rows={FIELDING_RULES} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesSection({ title, color, rows, note }) {
  const headingColor =
    color === 'neon' ? 'text-neon' : color === 'crimson' ? 'text-crimson-soft' : 'text-alert';
  const dotColor =
    color === 'neon' ? 'bg-neon' : color === 'crimson' ? 'bg-crimson' : 'bg-alert';

  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${headingColor}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        {title}
      </p>
      <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
        {rows.map((row, i) => (
          <div
            key={row.event}
            className={`flex items-center justify-between px-4 py-2.5 text-sm ${
              i < rows.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <span className={row.negative ? 'text-slate-400' : 'text-slate-300'}>{row.event}</span>
            <span className={`scoreboard font-bold ${row.negative ? 'text-crimson-soft' : headingColor}`}>{row.pts}</span>
          </div>
        ))}
      </div>
      {note && <p className="mt-1.5 px-1 text-[10px] text-slate-500">{note}</p>}
    </div>
  );
}

export default function Leaderboard({ onBack }) {
  const [players, setPlayers] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(true)}
            aria-label="Points system"
            data-tour="leaderboard-info"
            className="btn-press grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400"
          >
            <Info size={16} />
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

      {showRules && <RulesSheet onClose={() => setShowRules(false)} />}
    </div>
  );
}
