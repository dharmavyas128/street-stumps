import { Trophy, Handshake, Crown, Star, Zap, Disc3, Hand } from 'lucide-react';
import {
  oversText,
  maxWickets,
  teamName,
  bowlerEconomy,
  dismissalLine,
  computeAwards,
  BATSMAN_STATUS,
} from '../engine/matchEngine';

/**
 * MatchSummary — final result banner + awards + both innings scorecards.
 * `footer` lets the caller supply the action buttons (Save/Delete when a match
 * just finished, or a Back button when viewing from history).
 */
export default function MatchSummary({ state, footer }) {
  const { result, innings, config } = state;
  const tie = result?.type === 'tie';
  const awards = computeAwards(state);

  return (
    <div className="space-y-4 animate-pop-in">
      {/* Result banner */}
      <div
        className={`glass-strong relative overflow-hidden p-6 text-center ${
          tie ? '' : 'shadow-glow-green'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-neon/15 blur-3xl" />
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon/15 text-neon ring-1 ring-neon/30">
          {tie ? <Handshake size={28} /> : <Trophy size={28} />}
        </span>
        <h2 className="relative mt-3 text-xl font-extrabold text-white">
          {result?.text}
        </h2>
        <p className="relative mt-1 text-xs uppercase tracking-widest text-slate-400">
          Match Complete
        </p>
      </div>

      {/* Achievements */}
      {awards && <AwardsCard awards={awards} />}

      {/* Innings scorecards */}
      {innings.map((inn, i) =>
        inn ? <InningsCard key={i} inn={inn} config={config} index={i} state={state} /> : null
      )}

      {footer}
    </div>
  );
}

function InningsCard({ inn, config, index, state }) {
  const name = teamName(state, inn.battingTeamId);
  const extrasTotal =
    inn.extras.wides + inn.extras.noBalls + inn.extras.byes + inn.extras.legByes;

  return (
    <div className="glass p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Innings {index + 1}
          </p>
          <h3 className="text-base font-bold text-white">{name}</h3>
        </div>
        <div className="text-right">
          <p className="scoreboard text-2xl font-extrabold text-white">
            {inn.runs}/{inn.wickets}
          </p>
          <p className="scoreboard text-xs text-slate-400">
            {oversText(inn.legalBalls)} ov
          </p>
        </div>
      </div>

      {/* Batters */}
      <div className="mt-3 space-y-1">
        {inn.batsmen
          .filter((b) => b.status !== BATSMAN_STATUS.DID_NOT_BAT)
          .map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-white/[0.02]"
            >
              <span className="flex items-center gap-1 truncate text-sm text-slate-100">
                {b.name}
                {b.isCaptain && (
                  <Crown size={11} className="shrink-0 text-amber-300" fill="currentColor" />
                )}
                <span className="ml-1 text-[11px] text-slate-500">
                  {dismissalLine(state, b)}
                </span>
              </span>
              <span className="scoreboard text-sm font-bold text-white">{b.runs}</span>
              <span className="scoreboard w-10 text-right text-xs text-slate-500">
                ({b.balls})
              </span>
            </div>
          ))}
      </div>

      {/* Extras + total */}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
        <span>
          Extras <span className="scoreboard font-semibold text-slate-200">{extrasTotal}</span>{' '}
          (wd {inn.extras.wides}, nb {inn.extras.noBalls}, b {inn.extras.byes}, lb{' '}
          {inn.extras.legByes})
        </span>
        <span className="text-slate-500">
          {maxWickets(config) - inn.wickets} wkt left
        </span>
      </div>

      {/* Bowling */}
      {inn.bowlers && inn.bowlers.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-1 grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>{teamName(state, inn.bowlingTeamId)} bowling</span>
            <span className="w-8 text-right">O</span>
            <span className="w-6 text-right">M</span>
            <span className="w-8 text-right">R-W</span>
            <span className="w-12 text-right">Econ</span>
          </div>
          {inn.bowlers.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 rounded-lg px-2 py-1 text-sm text-slate-200"
            >
              <span className="truncate">{b.name}</span>
              <span className="scoreboard w-8 text-right text-xs">{oversText(b.balls)}</span>
              <span className="scoreboard w-6 text-right text-xs text-slate-400">
                {b.maidens}
              </span>
              <span className="scoreboard w-8 text-right text-xs font-semibold text-white">
                {b.runs}-{b.wickets}
              </span>
              <span className="scoreboard w-12 text-right text-xs text-neon">
                {bowlerEconomy(b).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Achievements ---------------- */

function AwardsCard({ awards }) {
  const { manOfMatch, bestBatsman, bestBowler, bestFielder } = awards;
  return (
    <div className="glass-strong relative overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-x-0 -top-12 h-28 bg-amber-300/10 blur-3xl" />
      <div className="relative mb-3 flex items-center gap-2">
        <Star size={18} className="text-amber-300" fill="currentColor" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-200">
          Achievements
        </h3>
      </div>

      {manOfMatch && (
        <div className="relative mb-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-center shadow-glow-amber">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            Player of the Match
          </p>
          <p className="mt-1 text-xl font-extrabold text-white">{manOfMatch.name}</p>
          <p className="text-xs text-slate-300">{manOfMatch.teamName}</p>
          <p className="scoreboard mt-1 text-sm font-semibold text-amber-300">
            {manOfMatch.line}
          </p>
        </div>
      )}

      <div className="relative grid grid-cols-1 gap-2">
        <AwardRow icon={Zap} label="Best Batsman" player={bestBatsman} />
        <AwardRow icon={Disc3} label="Best Bowler" player={bestBowler} />
        {bestFielder && <AwardRow icon={Hand} label="Best Fielder" player={bestFielder} />}
      </div>
    </div>
  );
}

function AwardRow({ icon: Icon, label, player }) {
  if (!player) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon/15 text-neon ring-1 ring-neon/30">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-white">
          {player.name}{' '}
          <span className="text-[11px] font-normal text-slate-400">· {player.teamName}</span>
        </p>
      </div>
      <span className="scoreboard shrink-0 text-sm font-bold text-neon">{player.line}</span>
    </div>
  );
}
