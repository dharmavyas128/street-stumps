import { useReducer, useCallback } from 'react';
import { createSeries, createTournament, recordResult, endSeriesEarly } from '../competition';

function reducer(comp, action) {
  switch (action.type) {
    case 'INIT':
      return action.comp;
    case 'BEGIN_FIXTURE': {
      const next = structuredClone(comp);
      next.activeFixtureId = action.id;
      return next;
    }
    case 'RECORD':
      return recordResult(comp, action.summary);
    case 'END_SERIES':
      return endSeriesEarly(comp);
    case 'RESET':
      return null;
    default:
      return comp;
  }
}

/** Holds the active competition (series/tournament) and drives its fixtures. */
export function useCompetition() {
  const [comp, dispatch] = useReducer(reducer, null);

  const initSeries = useCallback(
    (cfg) => dispatch({ type: 'INIT', comp: createSeries(cfg) }),
    []
  );
  const initTournament = useCallback(
    (cfg) => dispatch({ type: 'INIT', comp: createTournament(cfg) }),
    []
  );
  const beginFixture = useCallback((id) => dispatch({ type: 'BEGIN_FIXTURE', id }), []);
  const recordFixture = useCallback((summary) => dispatch({ type: 'RECORD', summary }), []);
  const endSeries = useCallback(() => dispatch({ type: 'END_SERIES' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const load = useCallback((saved) => dispatch({ type: 'INIT', comp: saved }), []);

  return { comp, initSeries, initTournament, beginFixture, recordFixture, endSeries, reset, load };
}
