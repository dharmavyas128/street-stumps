/**
 * useMatchEngine — binds the pure reducer to React and layers an
 * IMMUTABLE MATCH HISTORY STACK on top for the perfect Undo feature.
 *
 * Model held in the reducer:
 *   { present: MatchState, history: MatchState[] }
 *
 * Before any state-changing delivery action is applied, a *deep snapshot* of
 * the current `present` is pushed onto `history`. UNDO simply pops the last
 * snapshot and makes it `present` again — instant, exact, and unlimited depth.
 */
import { useReducer, useMemo, useCallback } from 'react';
import {
  createEmptyState,
  matchReducer,
  getMatchContext,
  EXTRA,
} from '../engine/matchEngine';
import { generateNarrative } from '../engine/narrative';

const DELIVERY_ACTIONS = new Set([
  'SCORE_RUNS',
  'EXTRA',
  'WICKET',
  'START_NEXT_INNINGS',
]);

function init() {
  return { present: createEmptyState(), history: [] };
}

function appReducer(model, action) {
  switch (action.type) {
    case 'SETUP_MATCH':
      // Fresh match — clear any prior history.
      return { present: matchReducer(model.present, action), history: [] };

    case 'RESET':
      return init();

    case 'LOAD_STATE':
      // Resume a saved match: make it `present`, drop any prior undo history.
      return { present: action.state, history: [] };

    case 'UNDO': {
      if (model.history.length === 0) return model;
      const previous = model.history[model.history.length - 1];
      return {
        present: previous,
        history: model.history.slice(0, -1),
      };
    }

    default: {
      // All delivery / innings-transition actions push a snapshot first.
      const next = matchReducer(model.present, action);
      if (next === model.present) return model; // guarded no-op, don't pollute history
      if (DELIVERY_ACTIONS.has(action.type)) {
        return {
          present: next,
          history: [...model.history, structuredClone(model.present)],
        };
      }
      return { present: next, history: model.history };
    }
  }
}

export function useMatchEngine() {
  const [model, dispatch] = useReducer(appReducer, undefined, init);
  const state = model.present;

  // ---- Action creators (stable identities) ----
  const setupMatch = useCallback(
    (form) => dispatch({ type: 'SETUP_MATCH', payload: form }),
    []
  );
  const scoreRuns = useCallback(
    (runs) => dispatch({ type: 'SCORE_RUNS', payload: { runs } }),
    []
  );
  const addExtra = useCallback(
    (extraType, runs = 0) => dispatch({ type: 'EXTRA', payload: { extraType, runs } }),
    []
  );
  const takeWicket = useCallback(
    (payload) => dispatch({ type: 'WICKET', payload }),
    []
  );
  const selectBowler = useCallback(
    (bowlerId) => dispatch({ type: 'SELECT_BOWLER', payload: { bowlerId } }),
    []
  );
  const startNextInnings = useCallback(
    () => dispatch({ type: 'START_NEXT_INNINGS' }),
    []
  );
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const loadState = useCallback((s) => dispatch({ type: 'LOAD_STATE', state: s }), []);

  // ---- Derived, memoised view-model ----
  const context = useMemo(() => getMatchContext(state), [state]);
  const narrative = useMemo(() => generateNarrative(state), [state]);

  return {
    state,
    status: state.status,
    context,
    narrative,
    canUndo: model.history.length > 0,
    historyDepth: model.history.length,
    // actions
    setupMatch,
    scoreRuns,
    addExtra,
    takeWicket,
    selectBowler,
    startNextInnings,
    undo,
    reset,
    loadState,
    EXTRA,
  };
}
