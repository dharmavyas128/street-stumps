import { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import Sparkline from './Sparkline';

const COLUMNS = [
  { key: 'points', label: 'Pts', fmt: (v) => Math.round(v) },
  { key: 'runs', label: 'Runs', fmt: (v) => v },
  { key: 'hs', label: 'HS', fmt: (v) => v },
  { key: 'ave', label: 'Ave', fmt: (v) => (v == null ? '—' : v.toFixed(1)) },
  { key: 'wickets', label: 'Wkts', fmt: (v) => v },
  { key: 'econ', label: 'Econ', fmt: (v) => (v == null ? '—' : v.toFixed(1)) },
  { key: 'bave', label: 'B-Ave', fmt: (v) => (v == null ? '—' : v.toFixed(1)) },
];

/**
 * LeaderboardTable — sortable stats table with inline form sparklines. Shared
 * by the global Leaderboard page and the per-series leaderboard tab. When
 * `compareMode` is on it renders a checkbox column (max 2 via the parent).
 */
export default function LeaderboardTable({
  players,
  compareMode = false,
  selectedIds = [],
  onToggleSelect,
  showTeam = false,
}) {
  const [sortKey, setSortKey] = useState('points');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const arr = [...players];
    arr.sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = av == null;
      const bn = bv == null;
      if (an && bn) return 0;
      if (an) return 1;
      if (bn) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return arr;
  }, [players, sortKey, sortDir]);

  const sort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const arrowFor = (key) =>
    key === sortKey ? (
      sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />
    ) : (
      <ChevronsUpDown size={12} className="opacity-30" />
    );

  const maxed = selectedIds.length >= 2;

  return (
    <div className="glass overflow-x-auto p-1">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-slate-500">
            {compareMode && <th className="w-8 p-2" />}
            <th className="p-2 text-left">
              <HeaderButton onClick={() => sort('name')}>Player {arrowFor('name')}</HeaderButton>
            </th>
            {COLUMNS.map((c) => (
              <th key={c.key} className="p-2 text-right">
                <HeaderButton onClick={() => sort(c.key)} right>
                  {c.label} {arrowFor(c.key)}
                </HeaderButton>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const isSel = selectedIds.includes(p.id);
            const disabled = compareMode && !isSel && maxed;
            return (
              <tr key={p.id} className={`border-t border-white/5 ${isSel ? 'bg-neon/[0.08]' : ''}`}>
                {compareMode && (
                  <td className="p-2">
                    <button
                      onClick={() => onToggleSelect?.(p.id)}
                      disabled={disabled}
                      aria-label={`Select ${p.name}`}
                      className={`grid h-5 w-5 place-items-center rounded-md border transition ${
                        isSel
                          ? 'border-neon bg-neon text-midnight'
                          : disabled
                            ? 'border-white/10 opacity-30'
                            : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {isSel && <span className="text-[11px] font-bold">✓</span>}
                    </button>
                  </td>
                )}
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span className="scoreboard w-4 shrink-0 text-[11px] text-slate-500">{i + 1}</span>
                    <div className="min-w-0">
                      <span className="block truncate font-semibold text-white">{p.name}</span>
                      {showTeam && p.team && (
                        <span className="block truncate text-[10px] text-slate-500">{p.team}</span>
                      )}
                      <Sparkline scores={p.last5} ave={p.ave} />
                    </div>
                  </div>
                </td>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={`scoreboard p-2 text-right tabular-nums ${
                      c.key === sortKey ? 'font-bold text-white' : 'text-slate-300'
                    }`}
                  >
                    {c.fmt(p[c.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeaderButton({ children, onClick, right = false }) {
  return (
    <button
      onClick={onClick}
      className={`btn-press inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider hover:text-slate-200 ${
        right ? 'flex-row-reverse' : ''
      }`}
    >
      {children}
    </button>
  );
}
