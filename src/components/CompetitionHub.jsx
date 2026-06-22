import { useState } from 'react';
import { Trophy, Play, ChevronLeft, ScrollText, Swords, BarChart3, Flag, X } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { seriesStatus, standings, nextFixture, teamById } from '../competition';
import { competitionLeaderboard } from '../leaderboard';
import MatchSummary from './MatchSummary';
import EditScorecard from './EditScorecard';
import LeaderboardTable from './LeaderboardTable';

/**
 * CompetitionHub — the home base for a series/tournament: standings or series
 * score, the fixture list (with "Play next" + view-scorecard), and the champion
 * banner once it's done. `footer` carries Save/Delete when finished; `readOnly`
 * (history view) hides the play controls.
 */
export default function CompetitionHub({
  comp,
  onPlayFixture,
  onEndSeries,
  onEditFixture,
  savingEdit = false,
  footer,
  readOnly = false,
  onBack,
}) {
  const [viewing, setViewing] = useState(null); // a played fixture to inspect
  const [tab, setTab] = useState('games'); // series only: 'games' | 'leaderboard'
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [editingFixture, setEditingFixture] = useState(false);

  if (viewing?.matchState) {
    if (editingFixture && onEditFixture) {
      return (
        <EditScorecard
          state={viewing.matchState}
          saving={savingEdit}
          onCancel={() => setEditingFixture(false)}
          onSave={async (newState) => {
            await onEditFixture(viewing.id, newState);
            setEditingFixture(false);
            setViewing(null);
          }}
        />
      );
    }
    return (
      <MatchSummary
        state={viewing.matchState}
        footer={
          <div className={onEditFixture ? 'grid grid-cols-[auto_1fr] gap-2' : ''}>
            {onEditFixture && (
              <button
                onClick={() => setEditingFixture(true)}
                className="btn-press flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-semibold text-slate-200 hover:border-neon/40 hover:text-neon"
              >
                <Pencil size={16} />
                Edit
              </button>
            )}
            <button
              onClick={() => setViewing(null)}
              className="btn-press flex w-full items-center justify-center gap-1 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          </div>
        }
      />
    );
  }

  const next = comp.done ? null : nextFixture(comp);
  const isSeries = comp.kind === 'series';
  const sStatus = isSeries ? seriesStatus(comp) : null;
  const table = isSeries ? null : standings(comp);
  const champ = comp.champion ? teamById(comp, comp.champion) : null;

  return (
    <div className="space-y-4 animate-pop-in">
      {readOnly && (
        <button onClick={onBack} className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300">
          <ChevronLeft size={18} />
          Home
        </button>
      )}

      {/* Champion banner (once the whole series/tournament is done) */}
      {comp.done && (
        <div className="glass-strong glass-box relative overflow-hidden p-6 text-center shadow-glow-green">
          <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-neon/15 blur-3xl" />
          <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-300/15 text-amber-300 ring-1 ring-amber-300/30">
            <Trophy size={28} />
          </span>
          <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            {isSeries ? 'Series Winner' : 'Champion'}
          </p>
          <h2 className="relative mt-1 text-2xl font-extrabold text-white">
            {champ ? champ.name : 'Drawn'}
          </h2>
          {isSeries && (
            <p className="scoreboard relative mt-1 text-sm text-slate-300">
              {comp.teams[0].name} {sStatus.aWins} – {sStatus.bWins} {comp.teams[1].name}
            </p>
          )}
        </div>
      )}

      {/* Games / Leaderboard tabs */}
      <TabBar tab={tab} setTab={setTab} />

      {tab === 'games' && (
        <>
          {!comp.done && (
            <div className="glass-strong p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-200">
                {isSeries ? <Swords size={18} className="text-neon" /> : <ScrollText size={18} className="text-neon" />}
                <h2 className="text-sm font-semibold uppercase tracking-widest">
                  {isSeries ? `${comp.bestOf}-Game Series` : 'League Table'}
                </h2>
              </div>

              {isSeries ? (
                <div className="flex items-center justify-between gap-3 text-center">
                  <TeamScore name={comp.teams[0].name} wins={sStatus.aWins} lead={sStatus.aWins > sStatus.bWins} />
                  <div>
                    <p className="scoreboard text-2xl font-extrabold text-white">
                      {sStatus.aWins}–{sStatus.bWins}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      first to {sStatus.needed}
                    </p>
                  </div>
                  <TeamScore name={comp.teams[1].name} wins={sStatus.bWins} lead={sStatus.bWins > sStatus.aWins} />
                </div>
              ) : (
                <StandingsTable rows={table} />
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {isSeries ? 'Games' : 'Fixtures'}
            </p>
            {comp.fixtures.map((f) => (
              <FixtureRow
                key={f.id}
                comp={comp}
                fixture={f}
                isNext={!readOnly && next?.id === f.id}
                onPlay={() => onPlayFixture(f.id)}
                onView={f.matchState ? () => setViewing(f) : null}
              />
            ))}
          </div>

          {/* End the series early — crown whoever's leading, count games played. */}
          {isSeries &&
            !comp.done &&
            !readOnly &&
            onEndSeries &&
            sStatus.played > 0 &&
            comp.fixtures.some((f) => !f.played) &&
            (confirmEnd ? (
              <EndSeriesConfirm
                sStatus={sStatus}
                teams={comp.teams}
                onCancel={() => setConfirmEnd(false)}
                onConfirm={() => {
                  setConfirmEnd(false);
                  onEndSeries();
                }}
              />
            ) : (
              <button
                onClick={() => setConfirmEnd(true)}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-alert/40 bg-alert/10 py-3.5 text-sm font-semibold text-alert"
              >
                <Flag size={16} />
                End series here
              </button>
            ))}
        </>
      )}

      {tab === 'leaderboard' && <CompetitionLeaderboardSection comp={comp} />}

      {footer}
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const Btn = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`btn-press flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${
        tab === id ? 'bg-neon text-midnight shadow-glow-green' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      <Btn id="games" icon={Swords} label="Games" />
      <Btn id="leaderboard" icon={BarChart3} label="Leaderboard" />
    </div>
  );
}

function CompetitionLeaderboardSection({ comp }) {
  const players = competitionLeaderboard(comp);
  if (players.length === 0) {
    return (
      <div className="glass p-8 text-center text-sm text-slate-400">
        The leaderboard fills in once a game has been played.
      </div>
    );
  }
  return <LeaderboardTable players={players} showTeam />;
}

function TeamScore({ name, wins, lead }) {
  return (
    <div className="flex-1">
      <p className={`scoreboard text-3xl font-extrabold ${lead ? 'text-neon' : 'text-slate-300'}`}>{wins}</p>
      <p className="truncate text-xs text-slate-400">{name}</p>
    </div>
  );
}

function StandingsTable({ rows }) {
  const qualify = Math.min(4, rows.length); // teams advancing to the playoffs
  const fmtNrr = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span>Team</span>
        <span className="w-4 text-right">P</span>
        <span className="w-4 text-right">W</span>
        <span className="w-4 text-right">L</span>
        <span className="w-11 text-right">NRR</span>
        <span className="w-6 text-right">Pts</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.id}
          className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
            i < qualify ? 'bg-neon/[0.06]' : ''
          }`}
        >
          <span className="flex items-center gap-1.5 truncate text-slate-100">
            {i < qualify && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />}
            <span className="truncate">{r.name}</span>
          </span>
          <span className="scoreboard w-4 text-right text-slate-400">{r.P}</span>
          <span className="scoreboard w-4 text-right text-slate-400">{r.W}</span>
          <span className="scoreboard w-4 text-right text-slate-400">{r.L}</span>
          <span className={`scoreboard w-11 text-right ${r.nrr >= 0 ? 'text-slate-300' : 'text-red-400/80'}`}>
            {fmtNrr(r.nrr)}
          </span>
          <span className="scoreboard w-6 text-right font-bold text-white">{r.Pts}</span>
        </div>
      ))}
    </div>
  );
}

function EndSeriesConfirm({ sStatus, teams, onCancel, onConfirm }) {
  const { aWins, bWins } = sStatus;
  const tied = aWins === bWins;
  const leader = aWins > bWins ? teams[0] : teams[1];
  const outcome = tied
    ? `It's level at ${aWins}–${bWins} — the series will be a draw.`
    : `${leader.name} are leading ${Math.max(aWins, bWins)}–${Math.min(aWins, bWins)} and will be crowned series winner.`;

  return (
    <div className="glass-strong space-y-3 rounded-2xl border border-alert/30 p-4">
      <div className="flex items-center gap-2 text-alert">
        <Flag size={16} />
        <p className="text-sm font-bold">End the series now?</p>
      </div>
      <p className="text-xs text-slate-300">{outcome}</p>
      <p className="text-[11px] text-slate-500">
        Remaining games are dropped. Games already played still count toward career stats.
      </p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onCancel}
          className="btn-press flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-300"
        >
          <X size={15} />
          Keep playing
        </button>
        <button
          onClick={onConfirm}
          className="btn-press flex items-center justify-center gap-1.5 rounded-xl bg-alert py-3 text-sm font-bold text-midnight shadow-glow-amber"
        >
          <Flag size={15} />
          End series
        </button>
      </div>
    </div>
  );
}

function FixtureRow({ comp, fixture, isNext, onPlay, onView }) {
  const home = teamById(comp, fixture.homeId);
  const away = teamById(comp, fixture.awayId);
  const isKnockout = fixture.stage !== 'league';
  const label =
    fixture.label || (comp.kind === 'series' ? `Game ${fixture.game}` : null);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
        isKnockout
          ? 'border-amber-300/30 bg-amber-300/[0.06]'
          : isNext
            ? 'border-neon/30 bg-neon/[0.06]'
            : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <div className="min-w-0 flex-1">
        {label && (
          <p className={`text-[10px] font-bold uppercase tracking-wider ${isKnockout ? 'text-amber-300' : 'text-slate-500'}`}>
            {label}
          </p>
        )}
        <p className="truncate text-sm font-semibold text-white">
          {home?.name} <span className="text-slate-500">v</span> {away?.name}
        </p>
        {fixture.played ? (
          <>
            <p className="scoreboard text-[11px] text-slate-400">
              {fixture.home.runs}/{fixture.home.wkts} · {fixture.away.runs}/{fixture.away.wkts}
            </p>
            <p className="truncate text-[11px] text-neon">{fixture.result?.text}</p>
          </>
        ) : (
          <p className="text-[11px] text-slate-500">{isNext ? 'Up next' : 'Scheduled'}</p>
        )}
      </div>

      {fixture.played
        ? onView && (
            <button
              onClick={onView}
              className="btn-press shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300"
            >
              Scorecard
            </button>
          )
        : isNext && (
            <button
              onClick={onPlay}
              className="btn-press flex shrink-0 items-center gap-1.5 rounded-xl bg-neon px-4 py-2.5 text-sm font-bold text-midnight shadow-glow-green"
            >
              <Play size={15} className="fill-midnight" strokeWidth={2.5} />
              Play
            </button>
          )}
    </div>
  );
}
