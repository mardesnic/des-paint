import { describe, expect, it } from 'vitest';

import {
  LEVELS,
  PAINTS,
  PALETTE,
  POT,
  emptyRecipe,
  initialStats,
  isFull,
  isMatched,
  mix,
  newRound,
  pour,
  recordWin,
  startOver,
  targets,
  undo,
  type Paint,
  type Recipe,
  type Round,
} from './game';

// A repeatable random, so a failing round can be seen again.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

const recipe = (r: Partial<Recipe>): Recipe => ({ ...emptyRecipe(), ...r });

const round = (
  target: Partial<Recipe>,
  level: Round['level'] = 'hard'
): Round => ({
  level,
  target: recipe(target),
  drops: [],
  history: [],
});

const pourAll = (r: Round, drops: Paint[]) => drops.reduce(pour, r);

// Which of red, green and blue is strongest.
const strongest = (r: Partial<Recipe>) => {
  const c = mix(recipe(r))!;
  return ['r', 'g', 'b'][c.indexOf(Math.max(...c))];
};

describe('mixing', () => {
  it('mixes like paint', () => {
    const [r, g, b] = mix(recipe({ yellow: 1, blue: 1 }))!;
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    expect(strongest({ red: 1, yellow: 1 })).toBe('r');
    const purple = mix(recipe({ red: 1, blue: 1 }))!;
    expect(purple[1]).toBeLessThan(purple[0]);
    expect(purple[1]).toBeLessThan(purple[2]);
  });

  it('cares how much of each, not how many drops', () => {
    expect(mix(recipe({ red: 2, white: 2 }))).toEqual(
      mix(recipe({ red: 1, white: 1 }))
    );
    expect(mix(recipe({ red: 2, yellow: 1 }))).not.toEqual(
      mix(recipe({ red: 1, yellow: 1 }))
    );
  });

  it('lightens with white and darkens with black', () => {
    const sum = (c: number[]) => c[0] + c[1] + c[2];
    const blue = sum(mix(recipe({ blue: 1 }))!);
    expect(sum(mix(recipe({ blue: 1, white: 1 }))!)).toBeGreaterThan(blue);
    expect(sum(mix(recipe({ blue: 1, black: 1 }))!)).toBeLessThan(blue);
  });

  it('has nothing in an empty pot', () => {
    expect(mix(emptyRecipe())).toBeUndefined();
  });
});

describe('targets', () => {
  for (const level of LEVELS)
    it(`can all be made with the paints on ${level}`, () => {
      const list = targets(level);
      expect(list.length).toBeGreaterThan(2);
      for (const t of list) {
        const drops = PAINTS.flatMap((p) => Array<Paint>(t[p]).fill(p));
        expect(drops.length).toBeLessThanOrEqual(POT);
        expect(drops.every((p) => PALETTE[level].includes(p))).toBe(true);
        expect(isMatched(pourAll(round(t, level), drops))).toBe(true);
        expect(PAINTS.filter((p) => t[p]).length).toBeGreaterThan(1);
      }
    });

  it('start with orange, green and purple', () => {
    expect(targets('veryEasy')).toEqual([
      recipe({ red: 1, yellow: 1 }),
      recipe({ red: 1, blue: 1 }),
      recipe({ yellow: 1, blue: 1 }),
    ]);
  });

  it('use black only on Hard', () => {
    for (const level of LEVELS.slice(0, 3))
      expect(targets(level).every((t) => !t.black)).toBe(true);
    expect(targets('hard').some((t) => t.black)).toBe(true);
  });

  it('do not give the same colour twice in a row', () => {
    const random = seeded(3);
    let last = newRound('veryEasy', random).target;
    for (let i = 0; i < 50; i++) {
      const next = newRound('veryEasy', random, last).target;
      expect(next).not.toEqual(last);
      last = next;
    }
  });
});

describe('playing', () => {
  it('is solved when the pot is the colour, however much is in it', () => {
    let r = round({ red: 1, yellow: 1 }, 'veryEasy');
    r = pourAll(r, ['red', 'red']);
    expect(isMatched(r)).toBe(false);
    r = pour(r, 'yellow');
    expect(isMatched(r)).toBe(false);
    r = pour(r, 'yellow');
    expect(isMatched(r)).toBe(true);
    expect(pour(r, 'blue')).toBe(r);
    expect(undo(r)).toBe(r);
  });

  it('pours only the paints of the level', () => {
    const r = round({ red: 1, yellow: 1 }, 'veryEasy');
    expect(pour(r, 'white')).toBe(r);
    expect(pour(r, 'black')).toBe(r);
  });

  it('stops when the pot is full', () => {
    const r = pourAll(round({ red: 1, blue: 1 }), Array(POT).fill('red'));
    expect(isFull(r)).toBe(true);
    expect(pour(r, 'blue')).toBe(r);
  });

  it('undoes drops one at a time, and starting over too', () => {
    let r = pourAll(round({ red: 1, blue: 1 }), ['red', 'yellow']);
    r = startOver(r);
    expect(r.drops).toEqual([]);
    expect(startOver(r)).toBe(r);
    r = undo(r);
    expect(r.drops).toEqual(['red', 'yellow']);
    r = undo(undo(r));
    expect(r.drops).toEqual([]);
    expect(undo(r)).toBe(r);
  });

  it('counts a win', () => {
    let r = pour(round({ red: 1, blue: 1 }, 'easy'), 'red');
    expect(recordWin(initialStats, r)).toBe(initialStats);
    r = pour(r, 'blue');
    expect(recordWin(initialStats, r).easy.solved).toBe(1);
  });
});
