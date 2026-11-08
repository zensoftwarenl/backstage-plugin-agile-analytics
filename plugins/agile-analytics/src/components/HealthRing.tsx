import { Flex, Text } from '@backstage/ui';
import type { HealthPillarId } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { Pillar, scoreTone } from '../health';

// The ring of thirds of the Agile Analytics overview: the health score in the
// middle, each third as thick as its own score over a faint track.

const SIZE = 192;
// Stroke width of a third at score 0 and at 100
const MIN_WIDTH = 3;
const MAX_WIDTH = 28;
const INNER_RADIUS = SIZE / 2 - MAX_WIDTH - 2;
// Degrees of empty ring between two thirds
const GAP = 7;

/** Each third has its own green, as in Agile Analytics, whatever its score. */
export const PILLAR_COLORS: Record<HealthPillarId, string> = {
  dev: '#84d0ae',
  ops: '#5bbb86',
  agile: '#3f9a68',
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** A point on the ring; 0° is the top, angles run clockwise. */
function point(radius: number, degrees: number): [number, number] {
  const center = SIZE / 2;
  return [
    center + radius * Math.sin(toRadians(degrees)),
    center - radius * Math.cos(toRadians(degrees)),
  ];
}

/**
 * An arc from `from` to `to` degrees, `width` thick, its inner edge on
 * INNER_RADIUS so the hole stays round. The path is shortened by the round
 * caps, so every arc of a third starts and ends at the same place.
 */
export function arcPath(from: number, to: number, width: number): string {
  const radius = INNER_RADIUS + width / 2;
  const cap = ((width / 2 / radius) * 180) / Math.PI;
  const [x0, y0] = point(radius, from + cap);
  const [x1, y1] = point(radius, to - cap);
  const large = to - from - 2 * cap > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(
    2,
  )} A ${radius} ${radius} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export const arcWidth = (score: number) =>
  MIN_WIDTH +
  ((MAX_WIDTH - MIN_WIDTH) * Math.max(0, Math.min(100, score))) / 100;

type HealthRingProps = {
  total: number | null;
  pillars: Pillar[];
  /** The third picked; the others fade. */
  active?: HealthPillarId | null;
  onSelect?: (id: HealthPillarId | null) => void;
};

/**
 * The health score in a ring of DevEx, OpsEx and AgileEx, with a legend that
 * offers the same choice to the keyboard and screen readers.
 */
export const HealthRing = ({
  total,
  pillars,
  active,
  onSelect,
}: HealthRingProps) => {
  const span = 360 / Math.max(1, pillars.length);
  const toggle = (id: HealthPillarId) => onSelect?.(active === id ? null : id);

  return (
    <Flex align="center" gap="5" style={{ flexWrap: 'wrap' }}>
      <div
        role="img"
        aria-label={
          total === null
            ? 'No health score yet'
            : `Engineering health score ${total} out of 100: ${pillars
                .map(p => `${p.name} ${p.score ?? 'no data'}`)
                .join(', ')}`
        }
        style={{
          position: 'relative',
          width: SIZE,
          height: SIZE,
          flexShrink: 0,
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden
        >
          {pillars.map((pillar, index) => {
            const from = (index - 0.5) * span + GAP / 2;
            const to = (index + 0.5) * span - GAP / 2;
            return (
              <g
                key={pillar.id}
                data-pillar={pillar.id}
                style={{
                  color: PILLAR_COLORS[pillar.id],
                  opacity: active && active !== pillar.id ? 0.35 : 1,
                  transition: 'opacity 200ms',
                  cursor: onSelect ? 'pointer' : undefined,
                }}
                onClick={() => toggle(pillar.id)}
              >
                <title>{`${pillar.name}: ${pillar.score ?? '–'}`}</title>
                <path
                  d={arcPath(from, to, MAX_WIDTH)}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.18}
                  strokeWidth={MAX_WIDTH}
                  strokeLinecap="round"
                />
                {pillar.score === null ? null : (
                  <path
                    d={arcPath(from, to, arcWidth(pillar.score))}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={arcWidth(pillar.score)}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 600,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--bui-fg-primary)',
            }}
          >
            {total ?? '–'}
          </span>
          <Text variant="body-x-small" color="secondary">
            /100
          </Text>
        </div>
      </div>
      <Flex direction="column" gap="2" role="group" aria-label="Thirds">
        {pillars.map(pillar => (
          <button
            key={pillar.id}
            type="button"
            aria-pressed={active === pillar.id}
            onClick={() => toggle(pillar.id)}
            title={pillar.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '2px 4px',
              border: 0,
              borderRadius: 'var(--bui-radius-2)',
              background:
                active === pillar.id
                  ? 'var(--bui-bg-neutral-2)'
                  : 'transparent',
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
              opacity: active && active !== pillar.id ? 0.5 : 1,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: PILLAR_COLORS[pillar.id],
              }}
            />
            <Text variant="body-medium" weight="bold">
              {pillar.name}
            </Text>
            <Text
              variant="body-medium"
              weight="bold"
              color={
                pillar.score === null ? 'secondary' : scoreTone(pillar.score)
              }
            >
              {pillar.score ?? '–'}
            </Text>
          </button>
        ))}
      </Flex>
    </Flex>
  );
};
