import {
  PALETTE,
  TUBE_HOLDS,
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

// The test tube: straight sides and a round bottom.
const TUBE = 'M50 20V154a20 20 0 0 0 40 0V20z';
// Where the paint stands with nothing in it, and how high a full tube is.
const BOTTOM = 174;
const DEPTH = 140;

export function Board({
  round,
  onPour,
  t,
}: {
  round: Round;
  onPour: (p: Paint) => void;
  t: Strings;
}) {
  const now = mix(count(round.drops));
  const target = css(mix(round.target)!);
  const solved = isMatched(round);
  const full = isFull(round);
  // How high the paint stands in the tube: each drop the same.
  const top = BOTTOM - (DEPTH * round.drops.length) / TUBE_HOLDS;
  const last = round.drops[round.drops.length - 1];

  return (
    <div className={solved ? 'board board--solved' : 'board'}>
      <div className='pictures'>
        <figure className='picture'>
          <svg viewBox='-60 -60 120 120' className='splat' aria-hidden='true'>
            <path d={SPLAT} style={{ fill: target }} />
          </svg>
          <div className='recipe' />
        </figure>

        <figure className='picture'>
          <svg
            viewBox='30 0 80 190'
            className='tube'
            role='img'
            aria-label={t.tube}
          >
            <defs>
              <clipPath id='inside'>
                <path d={TUBE} />
              </clipPath>
            </defs>
            <ellipse className='tube__shadow' cx='70' cy='182' rx='26' ry='4' />
            <path className='tube__inside' d={TUBE} />
            {now && (
              <g clipPath='url(#inside)'>
                <rect
                  className='tube__paint'
                  x='0'
                  y={top}
                  width='140'
                  height='190'
                  style={{ fill: css(now) }}
                />
                <ellipse
                  className='tube__paint tube__surface'
                  cx='70'
                  cy={top}
                  rx='19'
                  ry='3'
                  style={{ fill: css(now) }}
                />
              </g>
            )}
            {last && (
              <circle
                key={round.drops.length}
                className='tube__drop'
                cx='70'
                cy={top}
                r='6'
                style={
                  {
                    fill: css(colourOf(last)),
                    '--fall': `${top}px`,
                  } as React.CSSProperties
                }
              />
            )}
            <path className='tube__shine' d='M57 34v118' />
            <path className='tube__wall' d={TUBE} />
            <rect
              className='tube__lip'
              x='44'
              y='12'
              width='52'
              height='10'
              rx='5'
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
