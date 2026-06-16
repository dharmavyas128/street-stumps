import { useState } from 'react';
import { ChevronLeft, Coins, Sparkles } from 'lucide-react';

/**
 * TossScreen — Step 3 of the wizard.
 * Flow: pick who CALLS → they call Heads/Tails → flip the coin →
 * if the coin matches the call the caller wins, else the other side →
 * the winner chooses to bat or bowl. Heads = Team A, Tails = Team B.
 * onComplete({ winnerId, decision, callerId, call }).
 */
export default function TossScreen({ teamAName, teamBName, onBack, onComplete }) {
  const [phase, setPhase] = useState('caller'); // caller | call | ready | flipping | won
  const [callerId, setCallerId] = useState(null); // 'A' | 'B'
  const [call, setCall] = useState(null); // 'heads' | 'tails'
  const [landed, setLanded] = useState(null); // 'heads' | 'tails'
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);

  const nameOf = (id) => (id === 'A' ? teamAName : teamBName);
  const other = (id) => (id === 'A' ? 'B' : 'A');
  const initial = (n) => (n || '?').trim().charAt(0).toUpperCase();

  const chooseCaller = (id) => {
    setCallerId(id);
    setPhase('call');
  };

  const chooseCall = (c) => {
    setCall(c);
    setPhase('ready');
  };

  const flip = () => {
    if (phase === 'flipping') return;
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const w = result === call ? callerId : other(callerId);
    setPhase('flipping');
    setLanded(null);
    setWinner(null);
    setRotation((r) => (Math.floor(r / 360) + 6) * 360 + (result === 'tails' ? 180 : 0));
    setTimeout(() => {
      setLanded(result);
      setWinner(w);
      setPhase('won');
    }, 1800);
  };

  return (
    <div className="space-y-4 animate-pop-in">
      <section className="glass-strong relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-neon/10 blur-3xl" />

        <div className="relative flex items-center justify-center gap-2 text-slate-200">
          <Coins size={18} className="text-neon" />
          <h2 className="text-sm font-semibold uppercase tracking-widest">The Toss</h2>
        </div>

        {/* Heads / Tails legend */}
        <div className="relative mt-5 flex items-center justify-between gap-3 text-center">
          <SideChip label="Heads" name={teamAName} tint="neon" active={landed === 'heads'} />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">vs</span>
          <SideChip label="Tails" name={teamBName} tint="amber" active={landed === 'tails'} />
        </div>

        {/* The coin */}
        <div className="relative mt-7 grid place-items-center" style={{ perspective: '900px' }}>
          <div
            className="relative h-32 w-32"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotation}deg)`,
              transition: 'transform 1.8s cubic-bezier(0.18, 0.74, 0.2, 1)',
            }}
          >
            <CoinFace
              initial={initial(teamAName)}
              label="HEADS"
              tint="neon"
              faceStyle={{ transform: 'rotateX(0deg)' }}
            />
            <CoinFace
              initial={initial(teamBName)}
              label="TAILS"
              tint="amber"
              faceStyle={{ transform: 'rotateX(180deg)' }}
            />
          </div>
        </div>

        {/* Status line */}
        <div className="relative mt-6 min-h-[2.5rem] text-center">
          {phase === 'caller' && (
            <p className="text-sm text-slate-400">Who will call the toss?</p>
          )}
          {phase === 'call' && (
            <p className="text-sm font-medium text-slate-200">
              {nameOf(callerId)} — heads or tails?
            </p>
          )}
          {phase === 'ready' && (
            <p className="text-sm text-slate-300">
              {nameOf(callerId)} called{' '}
              <span className={call === 'heads' ? 'font-bold text-neon' : 'font-bold text-alert'}>
                {call === 'heads' ? 'Heads' : 'Tails'}
              </span>
            </p>
          )}
          {phase === 'flipping' && <p className="text-sm font-medium text-slate-300">Spinning…</p>}
          {phase === 'won' && (
            <p className="inline-flex items-center gap-1.5 text-base font-bold text-white">
              <Sparkles size={16} className="text-neon" />
              {nameOf(winner)} won the toss!
            </p>
          )}
        </div>
      </section>

      {/* Actions per phase */}
      {phase === 'caller' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => chooseCaller('A')}
            className="btn-press rounded-2xl border border-neon/40 bg-neon/15 py-5 text-base font-bold text-neon shadow-glow-green"
          >
            {teamAName}
          </button>
          <button
            onClick={() => chooseCaller('B')}
            className="btn-press rounded-2xl border border-alert/40 bg-alert/15 py-5 text-base font-bold text-alert shadow-glow-amber"
          >
            {teamBName}
          </button>
        </div>
      )}

      {phase === 'call' && (
        <div className="space-y-3 animate-pop-in">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => chooseCall('heads')}
              className="btn-press rounded-2xl bg-neon py-5 text-lg font-extrabold uppercase tracking-wide text-midnight shadow-glow-green"
            >
              Heads
            </button>
            <button
              onClick={() => chooseCall('tails')}
              className="btn-press rounded-2xl border border-alert/40 bg-alert/15 py-5 text-lg font-extrabold uppercase tracking-wide text-alert shadow-glow-amber"
            >
              Tails
            </button>
          </div>
          <button
            onClick={() => setPhase('caller')}
            className="btn-press w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-400"
          >
            Change caller
          </button>
        </div>
      )}

      {(phase === 'ready' || phase === 'flipping') && (
        <button
          onClick={flip}
          disabled={phase === 'flipping'}
          className="btn-press w-full rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green disabled:opacity-60"
        >
          {phase === 'flipping' ? 'Flipping…' : 'Flip the Coin'}
        </button>
      )}

      {phase === 'won' && (
        <div className="space-y-3 animate-pop-in">
          <p className="text-center text-xs uppercase tracking-widest text-slate-400">
            {nameOf(winner)} elects to…
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                onComplete({ winnerId: winner, decision: 'bat', callerId, call })
              }
              className="btn-press rounded-2xl bg-neon py-5 text-lg font-extrabold uppercase tracking-wide text-midnight shadow-glow-green"
            >
              Bat First
            </button>
            <button
              onClick={() =>
                onComplete({ winnerId: winner, decision: 'bowl', callerId, call })
              }
              className="btn-press rounded-2xl border border-alert/40 bg-alert/15 py-5 text-lg font-extrabold uppercase tracking-wide text-alert shadow-glow-amber"
            >
              Bowl First
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="btn-press flex w-full items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] py-3 text-sm font-semibold text-slate-300"
      >
        <ChevronLeft size={18} />
        Back to players
      </button>
    </div>
  );
}

function SideChip({ label, name, tint, active }) {
  const ring = tint === 'neon' ? 'text-neon ring-neon/30' : 'text-alert ring-alert/30';
  return (
    <div
      className={`flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 ring-1 transition ${
        active ? ring : 'ring-transparent'
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-widest ${
          tint === 'neon' ? 'text-neon' : 'text-alert'
        }`}
      >
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-slate-100">{name}</p>
    </div>
  );
}

function CoinFace({ initial, label, tint, faceStyle }) {
  const cls =
    tint === 'neon'
      ? 'text-neon ring-neon/40 shadow-glow-green'
      : 'text-alert ring-alert/40 shadow-glow-amber';
  return (
    <div
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...faceStyle }}
      className={`absolute inset-0 grid place-items-center rounded-full border border-white/10 bg-white/[0.07] ring-2 ${cls}`}
    >
      <div className="text-center">
        <div className="scoreboard text-4xl font-extrabold leading-none">{initial}</div>
        <div className="mt-1 text-[9px] font-semibold tracking-[0.2em] text-slate-400">
          {label}
        </div>
      </div>
    </div>
  );
}
