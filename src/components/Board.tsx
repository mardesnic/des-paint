import {
  PAINTS,
  PALETTE,
  POT,
  colourOf,
  count,
  css,
  isFull,
  isMatched,
  mix,
  type Paint,
  type Round,
} from '../lib/game';
import type { Strings } from '../lib/i18n';

// A paint splat around (0, 0), about 100 across: a round blob with soft
// bumps, drawn through the middle of each pair of points so it stays smooth.
const SPLAT = (() => {
  const n = 18;
  const points = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    const r = i % 2 ? 38 + (i % 4) * 1.5 : 48 + ((i * 7) % 5) * 2;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const mid = (i: number) => {
    const [x1, y1] = points[i % n];
    const [x2, y2] = points[(i + 1) % n];
    return `${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)}`;
  };
  let d = `M${mid(0)}`;
  for (let i = 1; i <= n; i++) {
    const [x, y] = points[i % n];
    d += `Q${x.toFixed(1)} ${y.toFixed(1)} ${mid(i)}`;
  }
  return d + 'Z';
})();

export function Board({
  round,
  hint,
  onPour,
  t,
}: {
  round: Round;
  hint: boolean;
  onPour: (p: Paint) => void;
  t: Strings;
}) {
  const now = mix(count(round.drops));
  const target = css(mix(round.target)!);
  const solved = isMatched(round);
  const full = isFull(round);
  // How high the paint stands in the pot: a little even for one drop.
  const level = round.drops.length
    ? 0.25 + (0.75 * round.drops.length) / POT
    : 0;
  const top = 128 - 70 * level;
  const last = round.drops[round.drops.length - 1];

  return (
    <div className={solved ? 'board board--solved' : 'board'}>
      <div className='pictures'>
        <figure className='picture'>
          <svg viewBox='-60 -60 120 120' className='splat' aria-hidden='true'>
            <path d={SPLAT} style={{ fill: target }} />
          </svg>
          <figcaption className='recipe' aria-hidden={!hint}>
            {hint &&
              PAINTS.flatMap((p) =>
                Array.from({ length: round.target[p] }, (_, i) => (
                  <span
                    key={`${p}${i}`}
                    className='dot'
                    style={{ background: css(colourOf(p)) }}
                    title={t.paints[p]}
                  />
                ))
              )}
          </figcaption>
        </figure>

        <figure className='picture'>
          <svg
            viewBox='0 0 140 140'
            className='pot'
            role='img'
            aria-label={t.pot}
          >
            <defs>
              <clipPath id='inside'>
                <path d='M22 52h96l-8 74a10 10 0 0 1-10 9H40a10 10 0 0 1-10-9z' />
              </clipPath>
            </defs>
            <path
              className='pot__inside'
              d='M22 52h96l-8 74a10 10 0 0 1-10 9H40a10 10 0 0 1-10-9z'
            />
            {now && (
              <g clipPath='url(#inside)'>
                <rect
                  className='pot__paint'
                  x='0'
                  y={top}
                  width='140'
                  height='140'
                  style={{ fill: css(now) }}
                />
                <ellipse
                  className='pot__paint pot__surface'
                  cx='70'
                  cy={top}
                  rx='60'
                  ry='6'
                  style={{ fill: css(now) }}
                />
              </g>
            )}
            {last && (
              <circle
                key={round.drops.length}
                className='pot__drop'
                cx='70'
                cy={top}
                r='5'
                style={{ fill: css(colourOf(last)) }}
              />
            )}
            <path
              className='pot__wall'
              d='M22 52h96l-8 74a10 10 0 0 1-10 9H40a10 10 0 0 1-10-9z'
            />
            <rect
              className='pot__rim'
              x='14'
              y='44'
              width='112'
              height='12'
              rx='6'
            />
          </svg>
          <figcaption className='recipe'>
            {round.drops.map((p, i) => (
              <span
                key={i}
                className='dot'
                style={{ background: css(colourOf(p)) }}
              />
            ))}
          </figcaption>
        </figure>
      </div>

      {!solved && (
        <div className='paints'>
          {PALETTE[round.level].map((p) => (
            <button
              key={p}
              className={`paint paint--${p}`}
              onClick={() => onPour(p)}
              disabled={full}
              aria-label={t.paints[p]}
            >
              <svg viewBox='0 0 60 60' aria-hidden='true'>
                <path
                  className='paint__blob'
                  d='M30 6c10 14 20 24 20 34a20 20 0 0 1-40 0c0-10 10-20 20-34z'
                  style={{ fill: css(colourOf(p)) }}
                />
                <ellipse
                  className='paint__shine'
                  cx='22'
                  cy='38'
                  rx='4'
                  ry='7'
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
