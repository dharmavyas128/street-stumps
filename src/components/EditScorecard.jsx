import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Save, Loader2, Pencil } from 'lucide-react';
import {
  teamName,
  recomputeMatch,
  oversText,
  BATSMAN_STATUS,
} from '../engine/matchEngine';
import { loadPlayers } from '../storage';

/**
 * EditScorecard — owner-only correction of a finished match. Edit batter lines
 * (name / runs / balls / 4s / 6s), extras, and bowler figures; the team total,
 * wickets, chase target and result are auto-recomputed on save. Only reachable
 * from the owner's own Match History, so no extra permission check is needed.
 */
export default function EditScorecard({ state, onSave, onCancel, saving }) {
  const [draft, setDraft] = useState(() => structuredClone(state));
  const [myPlayers, setMyPlayers] = useState([]);

  useEffect(() => {
    loadPlayers().then(setMyPlayers).catch(() => {});
  }, []);

  // Live preview of the derived totals/result as the owner types.
  const preview = useMemo(() => recomputeMatch(draft), [draft]);

  const num = (v) => Math.max(0, Math.trunc(Number(v) || 0));

  const editBatsman = (inn, batId, field, value) =>
    setDraft((d) => {
      const next = structuredClone(d);
      const b = next.innings[inn].batsmen.find((x) => x.id === batId);
      if (!b) return next;
      // Only the name is reassigned — the slot id stays put so it keeps matching
      // its ball-by-ball timeline entries (and stays unique for React keys).
      b[field] = field === 'name' ? value : num(value);
      return next;
    });

  const editExtra = (inn, field, value) =>
    setDraft((d) => {
      const next = structuredClone(d);
      next.innings[inn].extras[field] = num(value);
      return next;
    });

  const editBowler = (inn, bowlerId, field, value) =>
    setDraft((d) => {
      const next = structuredClone(d);
      const bw = next.innings[inn].bowlers.find((x) => x.id === bowlerId);
      if (!bw) return next;
      bw[field] = field === 'name' ? value : num(value);
      return next;
    });

  return (
    <div className="space-y-4 animate-pop-in">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300"
        >
          <ChevronLeft size={18} />
          Cancel
        </button>
        <span className="flex items-center gap-1.5 rounded-full bg-neon/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neon ring-1 ring-neon/20">
          <Pencil size={12} />
          Editing scorecard
        </span>
      </div>

      {/* Live result preview */}
      <div className="card-utility p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Recalculated result
        </p>
        <p className="mt-1 text-sm font-bold text-neon">
          {preview.result?.text || 'Result pending — needs both innings'}
        </p>
      </div>

      {draft.innings.map((inn, idx) =>
        inn ? (
          <InningsEditor
            key={idx}
            inn={inn}
            previewInn={preview.innings[idx]}
            index={idx}
            state={draft}
            myPlayers={myPlayers}
            onBatsman={(batId, f, v) => editBatsman(idx, batId, f, v)}
            onExtra={(f, v) => editExtra(idx, f, v)}
            onBowler={(bwId, f, v) => editBowler(idx, bwId, f, v)}
          />
        ) : null
      )}

      <button
        onClick={() => onSave(recomputeMatch(draft))}
        disabled={saving}
        className="btn-press sheenable flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green disabled:opacity-50"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

// Build { id, name } list from config.players for a given side.
function rosterFor(state, teamId) {
  const names = state.config.players?.[teamId] || [];
  return names.map((n, i) => ({ id: `${teamId}_b${i}`, name: String(n || `Batter ${i + 1}`).trim() }));
}

// Everyone named in the match — both squads, deduped by name. Combining the two
// rosters means a player who turned out for both teams (Shared Squad) is
// selectable on either side, not just the side they were first registered on.
function matchSquad(state) {
  const all = [...rosterFor(state, 'A'), ...rosterFor(state, 'B')];
  const seen = new Set();
  return all.filter((p) => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function InningsEditor({ inn, previewInn, index, state, myPlayers, onBatsman, onExtra, onBowler }) {
  const name = teamName(state, inn.battingTeamId);
  const batted = inn.batsmen.filter((b) => b.status !== BATSMAN_STATUS.DID_NOT_BAT);

  // Both dropdowns offer everyone who played in the match, then the rest of the
  // "My Players" roster for anyone who was missed off the teamsheet entirely.
  const squad = matchSquad(state);
  const squadNames = new Set(squad.map((p) => p.name.toLowerCase()));
  const extra = myPlayers.filter((p) => !squadNames.has(p.name.toLowerCase()));

  return (
    <div className="glass space-y-4 p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Innings {index + 1}
          </p>
          <h3 className="text-base font-bold text-white">{name}</h3>
        </div>
        <div className="text-right">
          <p className="scoreboard text-2xl font-extrabold text-white">
            {previewInn.runs}/{previewInn.wickets}
          </p>
          <p className="scoreboard text-xs text-slate-400">{oversText(inn.legalBalls)} ov</p>
        </div>
      </div>

      {/* Batters */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_3rem_3rem_2.5rem_2.5rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Batter</span>
          <span className="text-center">R</span>
          <span className="text-center">B</span>
          <span className="text-center">4s</span>
          <span className="text-center">6s</span>
        </div>
        {batted.map((b) => (
          <div key={b.id} className="grid grid-cols-[1fr_3rem_3rem_2.5rem_2.5rem] gap-2">
            <PlayerSelect
              value={b.name}
              options={squad}
              extraOptions={extra}
              onChange={(nm) => onBatsman(b.id, 'name', nm)}
            />
            <NumCell value={b.runs} onChange={(v) => onBatsman(b.id, 'runs', v)} />
            <NumCell value={b.balls} onChange={(v) => onBatsman(b.id, 'balls', v)} />
            <NumCell value={b.fours} onChange={(v) => onBatsman(b.id, 'fours', v)} />
            <NumCell value={b.sixes} onChange={(v) => onBatsman(b.id, 'sixes', v)} />
          </div>
        ))}
      </div>

      {/* Extras */}
      <div>
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Extras
        </p>
        <div className="grid grid-cols-4 gap-2">
          <LabelledNum label="Wd" value={inn.extras.wides} onChange={(v) => onExtra('wides', v)} />
          <LabelledNum label="Nb" value={inn.extras.noBalls} onChange={(v) => onExtra('noBalls', v)} />
          <LabelledNum label="B" value={inn.extras.byes} onChange={(v) => onExtra('byes', v)} />
          <LabelledNum label="Lb" value={inn.extras.legByes} onChange={(v) => onExtra('legByes', v)} />
        </div>
      </div>

      {/* Bowlers */}
      {inn.bowlers && inn.bowlers.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_3rem_2.5rem_3rem_2.5rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Bowler</span>
            <span className="text-center">Balls</span>
            <span className="text-center">M</span>
            <span className="text-center">R</span>
            <span className="text-center">W</span>
          </div>
          {inn.bowlers.map((bw) => (
            <div key={bw.id} className="grid grid-cols-[1fr_3rem_2.5rem_3rem_2.5rem] gap-2">
              <PlayerSelect
                value={bw.name}
                options={squad}
                extraOptions={extra}
                onChange={(nm) => onBowler(bw.id, 'name', nm)}
              />
              <NumCell value={bw.balls} onChange={(v) => onBowler(bw.id, 'balls', v)} />
              <NumCell value={bw.maidens} onChange={(v) => onBowler(bw.id, 'maidens', v)} />
              <NumCell value={bw.runs} onChange={(v) => onBowler(bw.id, 'runs', v)} />
              <NumCell value={bw.wickets} onChange={(v) => onBowler(bw.id, 'wickets', v)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NumCell({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="scoreboard w-full rounded-lg border border-white/10 bg-white/[0.06] px-1 py-1.5 text-center text-sm text-slate-100 outline-none focus:border-neon/40"
    />
  );
}

function LabelledNum({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-0.5 block px-1 text-[10px] uppercase text-slate-500">{label}</span>
      <NumCell value={value} onChange={onChange} />
    </label>
  );
}

// Dropdown that reassigns a slot to a player by NAME (the slot's id never
// changes, so timeline links and React keys stay intact). The current name is
// always selectable, even if it isn't in either roster list.
function PlayerSelect({ value, options, extraOptions = [], onChange }) {
  const inGame = [...new Set(options.map((o) => o.name))];
  const extra = [...new Set(extraOptions.map((o) => o.name))].filter((n) => !inGame.includes(n));
  const known = inGame.includes(value) || extra.includes(value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-0 rounded-lg border border-white/10 bg-[#0d1117] px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-neon/40"
    >
      {!known && <option value={value}>{value}</option>}
      <optgroup label="In this game">
        {inGame.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </optgroup>
      {extra.length > 0 && (
        <optgroup label="My Players">
          {extra.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
