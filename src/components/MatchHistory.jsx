import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, Trophy, ChevronRight, Inbox, Swords, ScrollText, Play, Loader2, Pencil } from 'lucide-react';
import { teamName, oversText } from '../engine/matchEngine';
import { seriesStatus, teamById, recordEditedFixture } from '../competition';
import { deleteMatch, updateMatch, updateCompetition } from '../storage';
import { loadOwnAndFriendsGames } from '../leaderboard';
import { useAuth } from '../auth/AuthContext';
import MatchSummary from './MatchSummary';
import EditScorecard from './EditScorecard';
import CompetitionHub from './CompetitionHub';

const isComp = (r) => r.kind === 'series' || r.kind === 'tournament';

/**
 * MatchHistory — browse saved games (Quick matches and competitions). Shows own
 * games plus accepted friends' saved games so every participant can review
 * scorecards. Only the owner can delete, edit, or resume a game.
 */
export default function MatchHistory({ onBack, onResume }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const isOwner = (record) => !record.userId || record.userId === user?.id;

  useEffect(() => {
    let on = true;
    loadOwnAndFriendsGames()
      .then((list) => on && setMatches(list))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, []);

  const remove = async (id, e) => {
    e?.stopPropagation();
    setMatches((ms) => ms.filter((m) => m.id !== id));
    setSelected((s) => (s?.id === id ? null : s));
    await deleteMatch(id).catch(() => {});
  };

  const open = (record) => {
    if (record.status === 'in_progress' && isOwner(record)) onResume?.(record);
    else if (record.status !== 'in_progress') { setSelected(record); setEditing(false); }
  };

  const saveEdit = async (newState) => {
    setSavingEdit(true);
    try {
      await updateMatch(selected.id, newState);
      const updated = { ...selected, state: newState };
      setSelected(updated);
      setMatches((ms) => ms.map((m) => (m.id === updated.id ? { ...m, state: newState } : m)));
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const editFixture = async (fixtureId, newState) => {
    setSavingEdit(true);
    try {
      const newComp = recordEditedFixture(selected.comp, fixtureId, newState);
      await updateCompetition(selected.id, newComp);
      const updated = { ...selected, comp: newComp };
      setSelected(updated);
      setMatches((ms) => ms.map((m) => (m.id === updated.id ? { ...m, comp: newComp } : m)));
    } finally {
      setSavingEdit(false);
    }
  };

  if (selected) {
    if (isComp(selected)) {
      return (
        <CompetitionHub
          comp={selected.comp}
          readOnly
          onEditFixture={editFixture}
          savingEdit={savingEdit}
          onBack={() => setSelected(null)}
        />
      );
    }
    if (editing) {
      return (
        <EditScorecard
          state={selected.state}
          saving={savingEdit}
          onSave={saveEdit}
          onCancel={() => setEditing(false)}
        />
      );
    }
    return (
      <MatchSummary
        state={selected.state}
        footer={
          <div className={`grid gap-2 ${isOwner(selected) ? 'grid-cols-[auto_1fr]' : 'grid-cols-1'}`}>
            {isOwner(selected) && (
              <button
                onClick={() => setEditing(true)}
                className="btn-press flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-semibold text-slate-200 hover:border-neon/40 hover:text-neon"
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
            <button
              onClick={() => setSelected(null)}
              className="btn-press flex items-center justify-center gap-1 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
            >
              <ChevronLeft size={18} />
              Back to History
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-4 animate-pop-in">
      <button onClick={onBack} className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300">
        <ChevronLeft size={18} />
        Home
      </button>

      <h2 className="px-1 text-lg font-bold text-white">Match History</h2>

      {loading ? (
        <div className="glass flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-neon" />
          Loading your games…
        </div>
      ) : matches.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 p-10 text-center">
          <Inbox size={32} className="text-slate-600" />
          <p className="text-sm text-slate-400">No saved games yet.</p>
          <p className="text-xs text-slate-500">
            Finish a game and tap <span className="text-neon">Save</span>, or park one with{' '}
            <span className="text-neon">Save &amp; exit</span> to resume later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) =>
            isComp(m) ? (
              <CompRow key={m.id} record={m} onOpen={() => open(m)} onDelete={(e) => remove(m.id, e)} isOwner={isOwner(m)} />
            ) : (
              <MatchRow key={m.id} record={m} onOpen={() => open(m)} onDelete={(e) => remove(m.id, e)} isOwner={isOwner(m)} />
            )
          )}
        </div>
      )}
    </div>
  );
}

const dateOf = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function Shell({ icon: Icon, tint, title, date, line1, line2, inProgress, isOwner, onOpen, onDelete }) {
  return (
    <button
      onClick={onOpen}
      className={`btn-press flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
        inProgress ? 'border-neon/30 bg-neon/[0.06]' : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tint}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-white">{title}</span>
          <span className="shrink-0 text-[10px] text-slate-500">{date}</span>
        </span>
        {inProgress && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-neon/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon">
            In progress
          </span>
        )}
        {line1 && !inProgress && <span className="mt-0.5 block truncate text-xs text-neon">{line1}</span>}
        {line2 && <span className="scoreboard mt-0.5 block truncate text-[11px] text-slate-400">{line2}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {isOwner && (
          <span
            role="button"
            onClick={onDelete}
            className="btn-press grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-crimson"
          >
            <Trash2 size={15} />
          </span>
        )}
        {inProgress && isOwner ? (
          <span className="flex items-center gap-1 rounded-lg bg-neon px-2.5 py-1.5 text-[11px] font-bold text-midnight">
            <Play size={12} className="fill-midnight" strokeWidth={2.5} />
            Resume
          </span>
        ) : (
          <ChevronRight size={18} className="text-slate-500" />
        )}
      </span>
    </button>
  );
}

function MatchRow({ record, onOpen, onDelete, isOwner }) {
  const { state, savedAt, status } = record;
  const inProgress = status === 'in_progress';
  const lineFor = (inn) =>
    inn ? `${teamName(state, inn.battingTeamId)} ${inn.runs}/${inn.wickets} (${oversText(inn.legalBalls)})` : '';
  const [a, b] = state.innings;
  return (
    <Shell
      icon={Trophy}
      tint="bg-neon/10 text-neon ring-neon/20"
      title={`${teamName(state, 'A')} vs ${teamName(state, 'B')}`}
      date={dateOf(savedAt)}
      line1={state.result?.text || 'Result'}
      line2={`${lineFor(a)}${b ? ` · ${lineFor(b)}` : ''}`}
      inProgress={inProgress}
      isOwner={isOwner}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );
}

function CompRow({ record, onOpen, onDelete, isOwner }) {
  const { comp, savedAt, status } = record;
  const inProgress = status === 'in_progress';
  const champ = comp.champion ? teamById(comp, comp.champion) : null;
  let title;
  let line2;
  if (comp.kind === 'series') {
    const s = seriesStatus(comp);
    title = `${comp.teams[0].name} v ${comp.teams[1].name}`;
    line2 = `${comp.fixtures.length}-game series · ${s.aWins}–${s.bWins}`;
  } else {
    title = `${comp.teams.length}-team tournament`;
    line2 = comp.teams.map((t) => t.name).join(', ');
  }
  return (
    <Shell
      icon={comp.kind === 'series' ? Swords : ScrollText}
      tint="bg-amber-300/10 text-amber-300 ring-amber-300/20"
      title={title}
      date={dateOf(savedAt)}
      line1={champ ? `🏆 ${champ.name}` : comp.kind === 'series' ? 'Series' : 'Tournament'}
      line2={line2}
      inProgress={inProgress}
      isOwner={isOwner}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );
}
