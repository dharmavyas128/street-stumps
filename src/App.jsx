import { useState, useEffect, useRef } from 'react';
import { Home as HomeIcon, Check, Save, Trash2, ArrowRight, Loader2, Trophy } from 'lucide-react';
import { useMatchEngine } from './hooks/useMatchEngine';
import { useCompetition } from './hooks/useCompetition';
import { useAuth } from './auth/AuthContext';
import { makeTeams, teamById, recordEditedFixture } from './competition';
import {
  saveMatch,
  saveCompetition,
  saveProgress,
  deleteMatch,
  loadMatches,
  loadPlayers,
} from './storage';
import { listFriendRequests, subscribeToFriendships, listFriendsLiveGames, subscribeToGames } from './data/db';
import { wasPlayerInGame } from './utils/gameHelpers';
import Logo from './components/Logo';
import StarField from './components/StarField';
import CloudLayer from './components/CloudLayer';
import ProfileSheet from './components/ProfileSheet';
import AuthScreen from './components/AuthScreen';
import ProfileSetup from './components/ProfileSetup';
import Home from './components/Home';
import MatchHistory from './components/MatchHistory';
import MyPlayers from './components/MyPlayers';
import Leaderboard from './components/Leaderboard';
import MatchSetup from './components/MatchSetup';
import TestModePicker from './components/TestModePicker';
import PlayerSetup from './components/PlayerSetup';
import TossScreen from './components/TossScreen';
import TournamentSetup from './components/TournamentSetup';
import TournamentPlayers from './components/TournamentPlayers';
import CompetitionHub from './components/CompetitionHub';
import MatchView from './components/MatchView';
import WatchView from './components/WatchView';
import AwardCeremony from './components/AwardCeremony';
import TourOverlay from './tour/TourOverlay';
import { TOUR_STEPS, DEMO_TOUR_DRAFT } from './tour/tourSteps';

const QUICK_STEPS = [
  { id: 'setup', label: 'Rules' },
  { id: 'players', label: 'Players' },
  { id: 'toss', label: 'Toss' },
];
const SERIES_STEPS = [
  { id: 'setup', label: 'Rules' },
  { id: 'players', label: 'Players' },
];

/** Boil a finished match state down to a competition result summary. */
function summarize(state) {
  const a = state.innings.find((i) => i && i.battingTeamId === 'A');
  const b = state.innings.find((i) => i && i.battingTeamId === 'B');
  return {
    winnerSide: state.result?.winnerId ?? null,
    aRuns: a?.runs ?? 0,
    aWkts: a?.wickets ?? 0,
    bRuns: b?.runs ?? 0,
    bWkts: b?.wickets ?? 0,
    text: state.result?.text ?? '',
    matchState: state,
  };
}

export default function App() {
  const { user, loading: authLoading, signOut, profile, profileLoading, isGuest, exitGuest } = useAuth();
  const engine = useMatchEngine();
  const { status } = engine;
  const comp = useCompetition();

  const [view, setView] = useState('home'); // home | quick | series | tournament | history | players | leaderboard
  const [historyCount, setHistoryCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [step, setStep] = useState('setup'); // shared rules→players wizard
  const [draft, setDraft] = useState({});
  const [resumeId, setResumeId] = useState(null); // in-progress DB row being played
  const [savingForLater, setSavingForLater] = useState(false);
  const [savingFixtureEdit, setSavingFixtureEdit] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState('profile');
  const [requestCount, setRequestCount] = useState(0);
  const [friendsTick, setFriendsTick] = useState(0); // bumps on realtime change
  const [liveGames, setLiveGames] = useState([]);    // friends' live games
  const [watchGame, setWatchGame] = useState(null);  // game being watched
  const [watchEnded, setWatchEnded] = useState(false);
  // Guided product tour (spotlight walkthrough launched from the profile sheet).
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  // Completed friend games the current user was a player in — persisted so the
  // scorecard survives page refreshes (cleaned up after 7 days).
  const [completedFriendGames, setCompletedFriendGames] = useState(() => {
    try {
      const raw = localStorage.getItem('ss-completed-friend-games');
      if (!raw) return [];
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return JSON.parse(raw).filter((g) => g.savedAt > cutoff);
    } catch { return []; }
  });
  const watchGameRef = useRef(null);
  useEffect(() => { watchGameRef.current = watchGame; }, [watchGame]);

  // Compact the header once scrolled, and feed scroll position to the
  // background layers (via the --sy CSS var) for a very slow parallax drift.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8); // React bails out when unchanged — cheap
      document.documentElement.style.setProperty('--sy', String(y));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Persist completed friend games to localStorage whenever the list changes.
  useEffect(() => {
    try { localStorage.setItem('ss-completed-friend-games', JSON.stringify(completedFriendGames)); } catch { /* ignore */ }
  }, [completedFriendGames]);

  // Keep the home-screen counts in sync with the cloud once signed in.
  const refreshCount = async () => {
    try {
      const [m, p] = await Promise.all([loadMatches(), loadPlayers()]);
      setHistoryCount(m.filter((r) => r.status !== 'in_progress').length);
      setPlayerCount(p.length);
    } catch {
      /* offline / not configured — leave counts as-is */
    }
  };
  const refreshRequests = async () => {
    try { setRequestCount((await listFriendRequests()).length); } catch { /* ignore */ }
  };
  const refreshLiveGames = async () => {
    try { setLiveGames(await listFriendsLiveGames()); } catch { /* ignore */ }
  };
  useEffect(() => {
    if (user) { refreshCount(); refreshRequests(); refreshLiveGames(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Live friend-request updates: refresh the badge and nudge an open sheet.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriendships(() => {
      refreshRequests();
      setFriendsTick((t) => t + 1);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Live game updates: refresh the Home "Live" list and stream ball-by-ball
  // changes into the game currently being watched.
  useEffect(() => {
    if (!user) return;
    let timer;
    const unsubscribe = subscribeToGames((payload) => {
      clearTimeout(timer);
      timer = setTimeout(refreshLiveGames, 400);
      const wg = watchGameRef.current;
      if (!wg) return;
      if (payload.eventType === 'DELETE') {
        if (payload.old?.id === wg.game_id) {
          setWatchEnded(true);
          // If the current user was a player, save the final state so the
          // scorecard persists on the Home screen after the game is deleted.
          if (wasPlayerInGame(wg.data, profile?.name)) {
            setCompletedFriendGames((prev) => [
              { ...wg, savedAt: Date.now() },
              ...prev.filter((g) => g.game_id !== wg.game_id),
            ]);
          }
        }
        return;
      }
      const row = payload.new;
      if (row?.id === wg.game_id) {
        setWatchGame({ ...wg, data: row.data, kind: row.kind, updated_at: row.updated_at });
      }
    });
    return () => { clearTimeout(timer); unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Owner side: while actively playing, auto-save state to the in-progress row
  // (debounced) so friends watching get near-real-time ball-by-ball updates.
  useEffect(() => {
    if (!user) return;
    let payload = null;
    if ((view === 'quick' || view === 'test') && status !== 'setup') {
      payload = { kind: 'match', data: { state: engine.state } };
    } else if ((view === 'series' || view === 'tournament') && comp.comp) {
      const data = { comp: comp.comp };
      if (activeFixture && status !== 'setup') data.activeMatchState = engine.state;
      payload = { kind: comp.comp.kind, data };
    }
    if (!payload) return;
    const t = setTimeout(async () => {
      try {
        const rec = await saveProgress({ id: resumeId, ...payload });
        if (!resumeId && rec?.id) setResumeId(rec.id);
      } catch { /* ignore transient autosave errors */ }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view, status, engine.state, comp.comp, resumeId]);

  const openProfile = (tab = 'profile') => { setSheetTab(tab); setProfileSheetOpen(true); };
  const watchGameOpen = (g) => { setWatchGame(g); setWatchEnded(false); setView('watch'); };
  const exitWatch = () => { setWatchGame(null); setWatchEnded(false); setView('home'); refreshLiveGames(); };

  const resetMatch = () => {
    engine.reset();
    setStep('setup');
    setDraft({});
  };
  const goHome = () => {
    resetMatch();
    comp.reset();
    setResumeId(null);
    refreshCount();
    setView('home');
  };
  const enter = (v) => {
    resetMatch();
    comp.reset();
    setResumeId(null);
    setView(v);
    // During the tour, pre-fill the Quick Match wizard with demo data so each
    // screen looks complete without the user typing. No real match is created.
    if (tourActive && v === 'quick') setDraft(DEMO_TOUR_DRAFT);
  };

  // Auto-launch tour once for first-time users (after profile setup completes).
  const tourAutoLaunched = useRef(false);
  useEffect(() => {
    if (!profile || isGuest || tourAutoLaunched.current) return;
    tourAutoLaunched.current = true;
    if (!localStorage.getItem('ss-tour-seen')) {
      localStorage.setItem('ss-tour-seen', '1');
      const t = setTimeout(() => { setTourStep(0); setTourActive(true); }, 400);
      return () => clearTimeout(t);
    }
  }, [profile, isGuest]);

  // ---- Guided tour controls ----
  const startTour = () => {
    setProfileSheetOpen(false);
    resetMatch();
    comp.reset();
    setResumeId(null);
    setView('home');
    setTourStep(0);
    setTourActive(true);
  };
  const endTour = () => {
    setTourActive(false);
    setProfileSheetOpen(false);
    localStorage.setItem('ss-tour-seen', '1');
    goHome();
  };
  const tourNext = () => {
    const cur = TOUR_STEPS[tourStep];
    // Side effects when leaving certain info steps (return the app to a place
    // where the next step's highlighted element exists).
    switch (cur?.key) {
      case 'profile-tabs':
        setProfileSheetOpen(false);
        setView('home');
        break;
      case 'quick-toss':
        resetMatch();
        setView('home');
        break;
      case 'players-add':
      case 'leaderboard-points':
        setView('home');
        break;
      default:
        break;
    }
    if (tourStep + 1 >= TOUR_STEPS.length) { endTour(); return; }
    setTourStep((i) => i + 1);
  };

  // Auto-advance "tap" steps: once the user taps the highlighted element and the
  // app navigates into the next step's location, move the tour forward.
  useEffect(() => {
    if (!tourActive) return;
    const cur = TOUR_STEPS[tourStep];
    if (!cur || cur.advance !== 'tap') return;
    const next = TOUR_STEPS[tourStep + 1];
    if (!next) return;
    const s = { view, wizardStep: step, sheetOpen: profileSheetOpen };
    if (next.where(s) && !cur.where(s)) setTourStep((i) => i + 1);
  }, [tourActive, tourStep, view, step, profileSheetOpen]);

  // ---- Shared setup wizard (Quick + Series) ----
  const handleSetupNext = (form) => {
    setDraft((d) => ({ ...d, ...form }));
    setStep('players');
  };
  const handlePlayersNext = ({ players, captains, picks }) => {
    if (view === 'series') {
      const teams = makeTeams(
        [draft.teamAName, draft.teamBName],
        [players.A, players.B],
        [captains.A, captains.B]
      );
      comp.initSeries({
        teams,
        rules: pickRules(draft),
        bestOf: draft.bestOf || 3,
      });
    } else {
      setDraft((d) => ({ ...d, players, captains, picks }));
      setStep('toss');
    }
  };
  const handleQuickToss = (toss) => engine.setupMatch({ ...draft, toss });

  // ---- Quick match save / delete / park-for-later ----
  const handleSaveGame = async () => {
    await saveMatch(engine.state);
    if (resumeId) await deleteMatch(resumeId).catch(() => {});
    goHome();
  };
  const saveQuickForLater = async () => {
    setSavingForLater(true);
    try {
      const rec = await saveProgress({ id: resumeId, kind: 'match', data: { state: engine.state } });
      setResumeId(rec.id);
      goHome();
    } finally {
      setSavingForLater(false);
    }
  };

  // ---- Competition fixtures ----
  const activeFixture = comp.comp?.fixtures.find((f) => f.id === comp.comp.activeFixtureId);
  const startFixtureToss = (toss) => {
    const c = comp.comp;
    const home = teamById(c, activeFixture.homeId);
    const away = teamById(c, activeFixture.awayId);
    engine.setupMatch({
      teamAName: home.name,
      teamBName: away.name,
      players: { A: home.players || [], B: away.players || [] },
      captains: { A: home.captain ?? null, B: away.captain ?? null },
      ...pickRules(c.rules),
      toss,
    });
  };
  const finishFixture = () => {
    comp.recordFixture(summarize(engine.state));
    engine.reset();
  };
  // Owner edits a finished game from within a live/resumed competition. Recompute
  // the fixture + standings/champion, replace the in-memory comp, and persist if
  // this competition is already parked in Match History (has a resume id).
  const editCompFixture = async (fixtureId, newState) => {
    setSavingFixtureEdit(true);
    try {
      const newComp = recordEditedFixture(comp.comp, fixtureId, newState);
      comp.load(newComp);
      if (resumeId) {
        await saveProgress({ id: resumeId, kind: newComp.kind, data: { comp: newComp } });
      }
    } finally {
      setSavingFixtureEdit(false);
    }
  };
  const saveComp = async () => {
    await saveCompetition(comp.comp);
    if (resumeId) await deleteMatch(resumeId).catch(() => {});
    goHome();
  };
  const saveCompForLater = async () => {
    setSavingForLater(true);
    try {
      const data = { comp: comp.comp };
      if (activeFixture && status !== 'setup') data.activeMatchState = engine.state;
      const rec = await saveProgress({ id: resumeId, kind: comp.comp.kind, data });
      setResumeId(rec.id);
      goHome();
    } finally {
      setSavingForLater(false);
    }
  };

  // ---- Resume a parked game from Match History ----
  const resumeGame = (record) => {
    setResumeId(record.id);
    if (record.kind === 'match') {
      engine.loadState(record.state);
      setView('quick');
    } else {
      comp.load(record.comp);
      if (record.activeMatchState) engine.loadState(record.activeMatchState);
      setView(record.kind);
    }
  };

  const teamA = draft.teamAName?.trim() || 'Team A';
  const teamB = draft.teamBName?.trim() || 'Team B';
  const playersPerTeam = draft.playersPerTeam ?? 6;

  // ---- Auth gate ----
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="grid min-h-full place-items-center">
        <Loader2 size={28} className="animate-spin text-neon" />
      </div>
    );
  }
  if (!user && !isGuest) {
    return <AuthScreen />;
  }
  if (!profile && !isGuest) {
    return <ProfileSetup />;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-8 pt-[max(env(safe-area-inset-top),1rem)]">
      <StarField />
      <CloudLayer />
      {view !== 'home' && (
        <header
          className={`sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between px-4 transition-all duration-300 ${
            scrolled
              ? 'border-b border-white/10 bg-midnight/70 py-2 backdrop-blur-xl'
              : 'border-b border-transparent py-1'
          }`}
        >
          <button onClick={goHome} className="btn-press flex items-center gap-2.5 text-left">
            <span
              className={`grid place-items-center overflow-hidden rounded-xl bg-neon/15 text-neon ring-1 ring-neon/30 transition-all duration-300 ${
                scrolled ? 'h-8 w-8' : 'h-9 w-9'
              }`}
            >
              <Logo size={scrolled ? 18 : 20} />
            </span>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                STREET<span className="text-neon"> </span>STUMPS
              </h1>
              <p
                className={`-mt-0.5 overflow-hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 transition-all duration-300 ${
                  scrolled ? 'max-h-0 opacity-0' : 'max-h-4 opacity-100'
                }`}
              >
                Live Cricket Scoring
              </p>
            </div>
          </button>

          {view !== 'history' && view !== 'players' && view !== 'leaderboard' && (
            <button
              onClick={goHome}
              className="btn-press grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
              title="Go home"
            >
              <HomeIcon size={16} />
            </button>
          )}
        </header>
      )}

      <ProfileSheet
        open={profileSheetOpen}
        onClose={() => { setProfileSheetOpen(false); refreshRequests(); }}
        initialTab={sheetTab}
        onRequestsChange={setRequestCount}
        refreshSignal={friendsTick}
        onPlayersChanged={refreshCount}
        onStartTutorial={startTour}
      />

      <main className="flex-1">
        {view === 'home' && (
          <Home
            onPlayQuick={() => enter('quick')}
            onPlaySeries={() => enter('series')}
            onPlayTournament={() => enter('tournament')}
            onPlayTest={() => enter('test')}
            onOpenPlayers={() => setView('players')}
            onOpenLeaderboard={() => setView('leaderboard')}
            onOpenHistory={() => setView('history')}
            onOpenProfile={() => openProfile('profile')}
            onOpenRequests={() => openProfile('friends')}
            requestCount={requestCount}
            liveGames={liveGames}
            onWatch={watchGameOpen}
            completedFriendGames={completedFriendGames}
            onViewCompleted={(g) => { setWatchGame(g); setWatchEnded(true); setView('watch'); }}
            onDismissCompleted={(gameId) =>
              setCompletedFriendGames((prev) => prev.filter((g) => g.game_id !== gameId))
            }
            playerCount={playerCount}
            historyCount={historyCount}
            userEmail={isGuest ? 'guest' : user.email}
            userName={isGuest ? 'Guest' : profile.name}
            avatarId={isGuest ? null : profile.avatar}
            isGuest={isGuest}
            onSignUp={exitGuest}
          />
        )}

        {view === 'watch' && watchGame && (
          <WatchView game={watchGame} ended={watchEnded} onBack={exitWatch} myName={profile?.name} />
        )}

        {view === 'award-ceremony' && comp.comp && (
          <AwardCeremony
            comp={comp.comp}
            onBack={() => setView(comp.comp.kind)}
          />
        )}

        {view === 'history' && <MatchHistory onBack={goHome} onResume={resumeGame} />}

        {view === 'players' && (
          <MyPlayers onBack={goHome} onChange={(n) => setPlayerCount(n)} />
        )}

        {view === 'leaderboard' && <Leaderboard onBack={goHome} />}

        {/* Quick match: rules → players → toss → play */}
        {view === 'quick' && status === 'setup' && (
          <>
            <WizardProgress steps={QUICK_STEPS} current={step} />
            {step === 'setup' && <MatchSetup initial={draft} onNext={handleSetupNext} />}
            {step === 'players' && (
              <PlayerSetup
                teamAName={teamA}
                teamBName={teamB}
                playersPerTeam={playersPerTeam}
                initialPicks={draft.picks}
                initialCaptains={draft.captains}
                sharedPlayers={!!draft.sharedPlayers}
                onBack={() => setStep('setup')}
                onNext={handlePlayersNext}
              />
            )}
            {step === 'toss' && (
              <TossScreen
                teamAName={teamA}
                teamBName={teamB}
                onBack={() => setStep('players')}
                onComplete={handleQuickToss}
              />
            )}
          </>
        )}

        {(view === 'quick' || view === 'test') && status !== 'setup' && (
          <MatchView
            engine={engine}
            onSaveForLater={saveQuickForLater}
            savingForLater={savingForLater}
            completeFooter={
              isGuest ? (
                <div className="space-y-2">
                  <p className="text-center text-xs text-slate-400">
                    Create a free account to save this scorecard
                  </p>
                  <button
                    onClick={exitGuest}
                    className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
                  >
                    <Save size={18} strokeWidth={2.5} />
                    Sign up & save
                  </button>
                  <button
                    onClick={goHome}
                    className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] py-3 text-sm font-semibold text-slate-400"
                  >
                    Discard & exit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={goHome}
                    className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-crimson/40 bg-crimson/15 py-4 text-sm font-bold text-crimson-soft"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                  <button
                    onClick={handleSaveGame}
                    className="btn-press flex items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
                  >
                    <Save size={18} strokeWidth={2.5} />
                    Save Game
                  </button>
                </div>
              )
            }
          />
        )}

        {/* Test: mode picker → rules → players → toss → play */}
        {view === 'test' && status === 'setup' && !draft.testMode && (
          <TestModePicker
            onBack={goHome}
            onPick={(mode) => {
              setDraft((d) => ({ ...d, format: 'test', testMode: mode }));
              setStep('setup');
            }}
          />
        )}

        {view === 'test' && status === 'setup' && draft.testMode && (
          <>
            <WizardProgress steps={QUICK_STEPS} current={step} />
            {step === 'setup' && <MatchSetup initial={draft} onNext={handleSetupNext} format="test" />}
            {step === 'players' && (
              <PlayerSetup
                teamAName={teamA}
                teamBName={teamB}
                playersPerTeam={playersPerTeam}
                initialPicks={draft.picks}
                initialCaptains={draft.captains}
                sharedPlayers={!!draft.sharedPlayers}
                onBack={() => setStep('setup')}
                onNext={handlePlayersNext}
              />
            )}
            {step === 'toss' && (
              <TossScreen
                teamAName={teamA}
                teamBName={teamB}
                onBack={() => setStep('players')}
                onComplete={handleQuickToss}
              />
            )}
          </>
        )}

        {/* Series setup: rules (+ length) → players */}
        {view === 'series' && !comp.comp && (
          <>
            <WizardProgress steps={SERIES_STEPS} current={step} />
            {step === 'setup' && (
              <MatchSetup initial={draft} onNext={handleSetupNext} showSeriesLength />
            )}
            {step === 'players' && (
              <PlayerSetup
                teamAName={teamA}
                teamBName={teamB}
                playersPerTeam={playersPerTeam}
                initialPicks={draft.picks}
                initialCaptains={draft.captains}
                sharedPlayers={!!draft.sharedPlayers}
                onBack={() => setStep('setup')}
                onNext={handlePlayersNext}
              />
            )}
          </>
        )}

        {/* Tournament setup: rules → players */}
        {view === 'tournament' && !comp.comp && (
          <>
            {step === 'setup' && (
              <TournamentSetup
                onBack={goHome}
                onNext={({ teamNames, rules }) => {
                  setDraft({ teamNames, rules });
                  setStep('players');
                }}
              />
            )}
            {step === 'players' && (
              <TournamentPlayers
                teamNames={draft.teamNames}
                playersPerTeam={draft.rules.playersPerTeam}
                onBack={() => setStep('setup')}
                onCreate={({ rosters, captains }) =>
                  comp.initTournament({
                    teams: makeTeams(draft.teamNames, rosters, captains),
                    rules: draft.rules,
                  })
                }
              />
            )}
          </>
        )}

        {/* Competition: hub / fixture toss / fixture play */}
        {comp.comp && (view === 'series' || view === 'tournament') && (
          <>
            {activeFixture && status === 'setup' && (
              <TossScreen
                teamAName={teamById(comp.comp, activeFixture.homeId).name}
                teamBName={teamById(comp.comp, activeFixture.awayId).name}
                onBack={() => comp.beginFixture(null)}
                onComplete={startFixtureToss}
              />
            )}

            {activeFixture && status !== 'setup' && (
              <MatchView
                engine={engine}
                matchLabel={activeFixture?.label}
                onSaveForLater={saveCompForLater}
                savingForLater={savingForLater}
                completeFooter={
                  <button
                    onClick={finishFixture}
                    className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
                  >
                    Continue to standings
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                }
              />
            )}

            {!activeFixture && (
              <CompetitionHub
                comp={comp.comp}
                onPlayFixture={(id) => comp.beginFixture(id)}
                onEndSeries={comp.endSeries}
                onEditFixture={editCompFixture}
                savingEdit={savingFixtureEdit}
                footer={
                  comp.comp.done ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setView('award-ceremony')}
                        className="btn-press sheenable flex w-full items-center justify-center gap-2 rounded-2xl border border-alert/50 bg-alert/10 py-4 text-base font-bold text-alert shadow-glow-amber"
                      >
                        <Trophy size={18} fill="currentColor" />
                        Award Ceremony
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={goHome}
                          className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-crimson/40 bg-crimson/15 py-4 text-sm font-bold text-crimson-soft"
                        >
                          <Trash2 size={18} />
                          Delete
                        </button>
                        <button
                          onClick={saveComp}
                          className="btn-press flex items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
                        >
                          <Save size={18} strokeWidth={2.5} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={saveCompForLater}
                      disabled={savingForLater}
                      className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 text-sm font-semibold text-slate-200 disabled:opacity-50"
                    >
                      {savingForLater ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save &amp; exit — resume later
                    </button>
                  )
                }
              />
            )}
          </>
        )}
      </main>

      {tourActive && (
        <TourOverlay
          step={TOUR_STEPS[tourStep]}
          index={tourStep}
          total={TOUR_STEPS.length}
          onNext={tourNext}
          onSkip={endTour}
        />
      )}
    </div>
  );
}

function pickRules(src) {
  return {
    totalOvers: src.totalOvers ?? 6,
    playersPerTeam: src.playersPerTeam ?? 6,
    lastManStanding: !!src.lastManStanding,
    retirementThreshold: src.retirementThreshold ?? 0,
  };
}

function WizardProgress({ steps, current }) {
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <div className="mb-4 flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                active
                  ? 'bg-neon text-midnight shadow-glow-green'
                  : done
                    ? 'bg-neon/20 text-neon'
                    : 'bg-white/5 text-slate-500'
              }`}
            >
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                active ? 'text-slate-100' : 'text-slate-500'
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className={`h-px flex-1 ${done ? 'bg-neon/40' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
