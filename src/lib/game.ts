// Paint mixing. A colour is shown, and the child pours drops of paint into
// a pot until the paint in the pot is that colour.

export const LEVELS = ['veryEasy', 'easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export const PAINTS = ['red', 'yellow', 'blue', 'white', 'black'] as const;
export type Paint = (typeof PAINTS)[number];

export type Rgb = [number, number, number];

// Drops of each paint. A colour to make is a recipe too.
export type Recipe = Record<Paint, number>;

// The paints each level has.
export const PALETTE: Record<Level, readonly Paint[]> = {
  veryEasy: ['red', 'yellow', 'blue'],
  easy: ['red', 'yellow', 'blue', 'white'],
  medium: ['red', 'yellow', 'blue', 'white'],
  hard: PAINTS,
};

// The pot holds this many drops; then it is full.
export const POT = 12;

// Paint mixes like paint, not like light: yellow and blue make green. Red,
// yellow and blue are the corners of a cube, and a mix of them is found
// between its corners (after Gossett and Chen's paint-like colour model).
const CUBE: Record<string, Rgb> = {
  '000': [1, 1, 1],
  '100': [0.89, 0.13, 0.15], // red
  '010': [1, 0.86, 0.1], // yellow
  '001': [0.13, 0.4, 0.8], // blue
  '110': [1, 0.55, 0.05], // orange
  '101': [0.52, 0.18, 0.6], // purple
  '011': [0.15, 0.62, 0.25], // green
  '111': [0.3, 0.19, 0.1], // brown
};

const WHITE: Rgb = [1, 1, 1];
const BLACK: Rgb = [0.1, 0.1, 0.12];

// A colour from red, yellow and blue, each from 0 to 1.
function ryb(r: number, y: number, b: number): Rgb {
  const out: Rgb = [0, 0, 0];
  for (const cr of [0, 1])
    for (const cy of [0, 1])
      for (const cb of [0, 1]) {
        const w = (cr ? r : 1 - r) * (cy ? y : 1 - y) * (cb ? b : 1 - b);
        const c = CUBE[`${cr}${cy}${cb}`];
        for (let i = 0; i < 3; i++) out[i] += w * c[i];
      }
  return out;
}

export const emptyRecipe = (): Recipe => ({
  red: 0,
  yellow: 0,
  blue: 0,
  white: 0,
  black: 0,
});

export const count = (drops: readonly Paint[]): Recipe => {
  const r = emptyRecipe();
  for (const d of drops) r[d]++;
  return r;
};

const total = (r: Recipe) => PAINTS.reduce((s, p) => s + r[p], 0);

// The colour of a mix, or undefined for an empty pot. Red, yellow and blue
// set the hue: what matters is how much of each there is next to the
// others, so one red and one yellow is the same orange as two and two.
// White then lightens it and black darkens it, by how much of each there is.
export function mix(r: Recipe): Rgb | undefined {
  const all = total(r);
  if (!all) return undefined;
  const top = Math.max(r.red, r.yellow, r.blue);
  const hue = top ? ryb(r.red / top, r.yellow / top, r.blue / top) : WHITE;
  const coloured = r.red + r.yellow + r.blue;
  // With no colour at all, white and black make grey.
  const parts: [Rgb, number][] = [
    [hue, coloured],
    [WHITE, r.white],
    [BLACK, r.black],
  ];
  const out: Rgb = [0, 0, 0];
  for (const [c, n] of parts)
    for (let i = 0; i < 3; i++) out[i] += (c[i] * n) / all;
  return out;
}

export const colourOf = (paint: Paint) =>
  mix({ ...emptyRecipe(), [paint]: 1 })!;

export const css = ([r, g, b]: Rgb) =>
  `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;

const distance = (a: Rgb, b: Rgb) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Close enough that nobody could tell them apart, so a mix that looks
// right is right even if it was made another way.
const SAME = 0.035;

export type Round = {
  level: Level;
  target: Recipe;
  // Drops in the pot, in the order poured.
  drops: Paint[];
  // Earlier `drops`, for Undo.
  history: Paint[][];
};

export function isMatched(round: Round) {
  const now = mix(count(round.drops));
  return !!now && distance(now, mix(round.target)!) < SAME;
}

export const isFull = (round: Round) => round.drops.length >= POT;

const change = (round: Round, drops: Paint[]): Round => ({
  ...round,
  drops,
  history: [...round.history, round.drops],
});

export function pour(round: Round, paint: Paint): Round {
  if (
    isFull(round) ||
    isMatched(round) ||
    !PALETTE[round.level].includes(paint)
  )
    return round;
  return change(round, [...round.drops, paint]);
}

export function undo(round: Round): Round {
  if (!round.history.length || isMatched(round)) return round;
  return {
    ...round,
    drops: round.history[round.history.length - 1],
    history: round.history.slice(0, -1),
  };
}

export function startOver(round: Round): Round {
  return round.drops.length && !isMatched(round) ? change(round, []) : round;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// Light enough to see what colour it is.
const lightness = ([r, g, b]: Rgb) => 0.3 * r + 0.59 * g + 0.11 * b;

// Every recipe of up to `most` drops of each paint.
function* recipes(paints: readonly Paint[], most: number): Generator<Recipe> {
  const n = paints.length;
  for (let code = 0; code < (most + 1) ** n; code++) {
    const r = emptyRecipe();
    let c = code;
    for (const p of paints) {
      r[p] = c % (most + 1);
      c = Math.floor(c / (most + 1));
    }
    yield r;
  }
}

// What the colours of a level are made of.
const RULES: Record<
  Level,
  { most: number; colours: [number, number]; drops: [number, number] }
> = {
  // Two of red, yellow and blue: orange, green and purple.
  veryEasy: { most: 1, colours: [2, 2], drops: [2, 2] },
  // One drop each of two or three paints, so also pink and light blue.
  easy: { most: 1, colours: [2, 3], drops: [2, 3] },
  // Now twice as much of one: reddish orange, pale pink.
  medium: { most: 2, colours: [2, 3], drops: [3, 4] },
  // Up to three drops of a paint, and black too.
  hard: { most: 3, colours: [2, 3], drops: [4, 6] },
};

// The colours to make on a level, each by its simplest recipe. Colours too
// close to one already in the list, or too dark to make out, are left out.
export function targets(level: Level): Recipe[] {
  const rule = RULES[level];
  const found: Recipe[] = [];
  const seen: Rgb[] = [];
  // Simplest first, so a colour is kept by its fewest drops.
  const all = [...recipes(PALETTE[level], rule.most)].sort(
    (a, b) => total(a) - total(b)
  );
  for (const r of all) {
    const used = PAINTS.filter((p) => r[p]);
    const n = total(r);
    if (used.length < rule.colours[0] || used.length > rule.colours[1])
      continue;
    if (n < rule.drops[0] || n > rule.drops[1]) continue;
    if (used.reduce((g, p) => gcd(g, r[p]), 0) !== 1) continue;
    // Easy has every Very easy colour, and some lighter ones.
    if (level === 'easy' && r.white === 0 && used.length === 3) continue;
    const c = mix(r)!;
    if (lightness(c) < 0.18) continue;
    // White and black alone only make grey.
    if (r.red + r.yellow + r.blue === 0) continue;
    if (seen.some((s) => distance(s, c) < SAME * 2)) continue;
    seen.push(c);
    found.push(r);
  }
  return found;
}

const cache = new Map<Level, Recipe[]>();
const targetsOf = (level: Level) => {
  if (!cache.has(level)) cache.set(level, targets(level));
  return cache.get(level)!;
};

const same = (a: Recipe, b: Recipe) => PAINTS.every((p) => a[p] === b[p]);

// A new colour for the level, not the same as `last`.
export function newRound(
  level: Level,
  random = Math.random,
  last?: Recipe
): Round {
  const list = targetsOf(level);
  let target: Recipe;
  do target = list[Math.floor(random() * list.length)];
  while (last && list.length > 1 && same(target, last));
  return { level, target: { ...target }, drops: [], history: [] };
}

export type Store = { round?: Round };

export const initialStore: Store = {};

export type Stats = { [L in Level]: { solved: number } };

export const initialStats = Object.fromEntries(
  LEVELS.map((l) => [l, { solved: 0 }])
) as Stats;

export const recordWin = (stats: Stats, round: Round): Stats =>
  isMatched(round)
    ? { ...stats, [round.level]: { solved: stats[round.level].solved + 1 } }
    : stats;
