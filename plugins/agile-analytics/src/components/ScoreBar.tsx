import type { Tone } from '../health';
import { toneColor } from './charts';

/** A 0-100 bar coloured by tone. */
export const ScoreBar = ({ score, tone }: { score: number; tone: Tone }) => (
  <div
    aria-hidden
    style={{
      height: 6,
      borderRadius: 'var(--bui-radius-full)',
      background: 'var(--bui-bg-neutral-2)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${Math.max(0, Math.min(100, score))}%`,
        height: '100%',
        borderRadius: 'inherit',
        background: toneColor(tone),
      }}
    />
  </div>
);
