/**
 * Ordered steps for the guided product tour. Each step either highlights a real
 * element (`target` → a `data-tour` attribute) or shows a centered intro card.
 *
 * advance:
 *   'tap'  → the user taps the highlighted element; the tour auto-advances once
 *            the app navigates into the next step's location.
 *   'next' → the step is informational; a "Next" button on the tooltip advances.
 *
 * where(state): predicate describing the app location this step belongs to, where
 *   state = { view, wizardStep, sheetOpen }. Used to drive auto-advance for tap
 *   steps and to know when an element should be on screen.
 */
export const TOUR_STEPS = [
  {
    key: 'intro',
    target: null,
    placement: 'center',
    title: 'Welcome to Street Stumps 👋',
    body: "Let's take a quick tour of the main features. I'll highlight things one at a time — tap Skip whenever you like.",
    advance: 'next',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'profile',
    target: 'profile-bar',
    placement: 'bottom',
    title: 'Your profile',
    body: 'Your stats, achievements, friends and theme all live here. Tap it to open.',
    advance: 'tap',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'profile-tabs',
    target: 'profile-tabs',
    placement: 'bottom',
    title: 'Three sections',
    body: 'Personal Info holds your career stats and badges. Friends lets you add people by email and watch their live games. Theme switches between light and dark.',
    advance: 'next',
    where: (s) => s.sheetOpen,
  },
  {
    key: 'quick',
    target: 'mode-quick',
    placement: 'bottom',
    title: 'Quick Match',
    body: 'A single 1v1 game — the fastest way to play. Tap it and I’ll walk you through the setup.',
    advance: 'tap',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'quick-rules',
    target: 'quick-rules-next',
    placement: 'top',
    title: 'Step 1 — Rules',
    body: "Name the teams and bend the rules: overs, players per side, auto-retire and last-man-standing. I've filled in demo teams — tap here to continue.",
    advance: 'tap',
    where: (s) => s.view === 'quick' && s.wizardStep === 'setup',
  },
  {
    key: 'quick-players',
    target: 'quick-players-next',
    placement: 'top',
    title: 'Step 2 — Players',
    body: 'Pick each side from your roster and tap the crown to set a captain. Tap here to head to the toss.',
    advance: 'tap',
    where: (s) => s.view === 'quick' && s.wizardStep === 'players',
  },
  {
    key: 'quick-toss',
    target: 'quick-toss',
    placement: 'bottom',
    title: 'Step 3 — Toss & start',
    body: "Flip the coin, the winner chooses to bat or bowl, and you're straight into live ball-by-ball scoring. That's the whole setup!",
    advance: 'next',
    where: (s) => s.view === 'quick' && s.wizardStep === 'toss',
  },
  {
    key: 'series',
    target: 'mode-series',
    placement: 'bottom',
    title: 'Series',
    body: 'A best-of-3, 5 or 7 between two teams — win the majority of games to take the series.',
    advance: 'next',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'tournament',
    target: 'mode-tournament',
    placement: 'bottom',
    title: 'Tournament',
    body: 'A round-robin league among 3–6 teams, followed by a knockout final.',
    advance: 'next',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'players',
    target: 'util-players',
    placement: 'top',
    title: 'My Players',
    body: 'Your saved roster of regulars. Tap to open it.',
    advance: 'tap',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'players-add',
    target: 'players-add',
    placement: 'bottom',
    title: 'Add players',
    body: 'Add anyone with their batting hand and bowling style — they become one-tap picks in every match. (To add friends, head to Profile → Friends and search by email.)',
    advance: 'next',
    where: (s) => s.view === 'players',
  },
  {
    key: 'leaderboard',
    target: 'util-leaderboard',
    placement: 'top',
    title: 'Leaderboard',
    body: 'Rankings, form and head-to-head across all your games. Tap to open it.',
    advance: 'tap',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
  {
    key: 'leaderboard-points',
    target: 'leaderboard-info',
    placement: 'bottom',
    title: 'Points system',
    body: 'Tap the ⓘ here anytime to see the full points table — exactly how batting, bowling and fielding are scored.',
    advance: 'next',
    where: (s) => s.view === 'leaderboard',
  },
  {
    key: 'history',
    target: 'util-history',
    placement: 'top',
    title: 'Match History',
    body: "Every saved game's full scorecard lives here. That's the tour — now go play! 🏏",
    advance: 'next',
    where: (s) => s.view === 'home' && !s.sheetOpen,
  },
];

/**
 * Demo data seeded into the Quick Match wizard during the tour so each screen
 * looks filled-in without the user typing. No real match is ever created — the
 * tour exits at the toss step before scoring begins.
 */
export const DEMO_TOUR_DRAFT = {
  teamAName: 'Strikers',
  teamBName: 'Chargers',
  totalOvers: 6,
  playersPerTeam: 4,
  picks: {
    A: [
      { id: 'tour-a1', name: 'Sam' },
      { id: 'tour-a2', name: 'Alex' },
      { id: 'tour-a3', name: 'Jordan' },
      { id: 'tour-a4', name: 'Riley' },
    ],
    B: [
      { id: 'tour-b1', name: 'Casey' },
      { id: 'tour-b2', name: 'Taylor' },
      { id: 'tour-b3', name: 'Morgan' },
      { id: 'tour-b4', name: 'Jamie' },
    ],
  },
  captains: { A: 0, B: 0 },
};
