import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

// ── Palette + option lists exposed in the builder UI ───────────────────────

export const BG_OPTIONS = [
  { id: 'b6e3f4', hex: '#b6e3f4' },
  { id: 'c0aede', hex: '#c0aede' },
  { id: 'd1f4d0', hex: '#d1f4d0' },
  { id: 'ffd5dc', hex: '#ffd5dc' },
  { id: 'ffd43b', hex: '#ffd43b' },
  { id: 'ff9f43', hex: '#ff9f43' },
];

export const SKIN_OPTIONS = [
  { id: 'ffdbb4', hex: '#ffdbb4' },
  { id: 'edb98a', hex: '#edb98a' },
  { id: 'd08b5b', hex: '#d08b5b' },
  { id: 'ae5d29', hex: '#ae5d29' },
  { id: '614335', hex: '#614335' },
  { id: 'fd9841', hex: '#fd9841' },
];

// T-shirt (clothing) colours — from the avataaars clothesColor palette.
export const SHIRT_OPTIONS = [
  { id: '262e33', hex: '#262e33' },
  { id: '5199e4', hex: '#5199e4' },
  { id: '25557c', hex: '#25557c' },
  { id: 'ff5c5c', hex: '#ff5c5c' },
  { id: 'a7ffc4', hex: '#a7ffc4' },
  { id: 'ffffb1', hex: '#ffffb1' },
  { id: 'ff488e', hex: '#ff488e' },
  { id: 'e6e6e6', hex: '#e6e6e6' },
];

export const HAIR_COLOR_OPTIONS = [
  { id: 'ecdcbf', hex: '#ecdcbf' },
  { id: 'a55728', hex: '#a55728' },
  { id: 'b58143', hex: '#b58143' },
  { id: '4a312c', hex: '#4a312c' },
  { id: '2c1b18', hex: '#2c1b18' },
  { id: 'c93305', hex: '#c93305' },
  { id: 'e8e1e1', hex: '#e8e1e1' },
  { id: 'f59797', hex: '#f59797' },
];

// Beard colours reuse the hair palette.
export const BEARD_COLOR_OPTIONS = HAIR_COLOR_OPTIONS;

export const TOP_OPTIONS = [
  { id: 'shortCurly',        label: 'Short Curly' },
  { id: 'frizzle',           label: 'Curly' },
  { id: 'shortWaved',        label: 'Waved' },
  { id: 'theCaesar',         label: 'Caesar' },
  { id: 'shortFlat',         label: 'Crew' },
  { id: 'bob',               label: 'Bob' },
  { id: 'bun',               label: 'Bun' },
  { id: 'curly',             label: 'Long Curly' },
  { id: 'longButNotTooLong', label: 'Long' },
  { id: 'dreads01',          label: 'Dreads' },
  { id: 'fro',               label: 'Afro' },
  { id: 'bigHair',           label: 'Big Hair' },
  { id: 'hat',               label: 'Cap' },
  { id: 'hijab',             label: 'Hijab' },
  { id: 'turban',            label: 'Turban' },
];

// Beard / facial-hair styles. `false` = clean-shaven.
export const BEARD_OPTIONS = [
  { id: 'beardLight',     label: 'Light' },
  { id: 'beardMedium',    label: 'Medium' },
  { id: 'beardMajestic',  label: 'Full' },
  { id: 'moustacheFancy', label: 'Moustache' },
  { id: 'moustacheMagnum',label: 'Handlebar' },
];

const COVERED_TOPS = new Set(['hat', 'hijab', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04']);

// Hats/hijab/turban hide the hair (so hair colour is moot) and read oddly with
// a beard, so the builder hides those controls for them.
export function isHatTop(top) {
  return COVERED_TOPS.has(top);
}

// ── Config helpers ─────────────────────────────────────────────────────────

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function newSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function makeConfig(overrides = {}) {
  return {
    seed: newSeed(),
    bg: 'b6e3f4',
    skin: 'edb98a',
    top: 'shortCurly',
    hair: 'b58143',
    shirt: '5199e4',
    beard: false,        // false or a BEARD_OPTIONS id
    beardColor: '2c1b18',
    ...overrides,
  };
}

export function randomizeConfig() {
  const top = rand(TOP_OPTIONS).id;
  const hat = isHatTop(top);
  return {
    seed: newSeed(),
    bg: rand(BG_OPTIONS).id,
    skin: rand(SKIN_OPTIONS).id,
    top,
    hair: rand(HAIR_COLOR_OPTIONS).id,
    shirt: rand(SHIRT_OPTIONS).id,
    beard: !hat && Math.random() < 0.4 ? rand(BEARD_OPTIONS).id : false,
    beardColor: rand(BEARD_COLOR_OPTIONS).id,
  };
}

// ── SVG generation ───────────────────────────────────────────────────────-

export function buildSvg(config) {
  if (!config) return null;
  try {
    const c = typeof config === 'string' ? JSON.parse(config) : config;
    if (!c || !c.seed) return null;
    // Only treat beard as a style when it's a known string id (older configs
    // may have stored a boolean — those read as clean-shaven).
    const beardId = typeof c.beard === 'string' ? c.beard : null;
    return createAvatar(avataaars, {
      seed: c.seed,
      backgroundColor: [c.bg || 'b6e3f4'],
      skinColor: [c.skin || 'edb98a'],
      top: [c.top || 'shortCurly'],
      topProbability: 100,
      hairColor: [c.hair || 'b58143'],
      clothing: ['shirtCrewNeck'],
      clothesColor: [c.shirt || '5199e4'],
      // Locked expression: natural smile + neutral eyes/brows on everyone.
      mouth: ['smile'],
      eyes: ['default'],
      eyebrows: ['default'],
      accessoriesProbability: 0,
      facialHairProbability: beardId ? 100 : 0,
      ...(beardId ? { facialHair: [beardId] } : {}),
      facialHairColor: [c.beardColor || '2c1b18'],
    }).toString();
  } catch {
    return null;
  }
}

export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function configToString(config) {
  return config ? JSON.stringify(config) : null;
}

export function parseConfig(str) {
  if (!str) return null;
  try {
    const obj = JSON.parse(str);
    return obj && obj.seed ? obj : null;
  } catch {
    return null;
  }
}
