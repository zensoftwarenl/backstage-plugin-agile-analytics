import { Flex, Text } from '@backstage/ui';
import type { Tone } from '../health';

// Small inline SVG charts. They size to their container and use the theme's
// colours, so they work in light and dark mode without a chart library.

const TONE_COLORS: Record<Tone | 'info', string> = {
  success: 'var(--bui-fg-positive)',
  warning: 'var(--bui-fg-warning)',
  danger: 'var(--bui-fg-negative)',
  info: 'var(--bui-fg-announcement)',
};

/** The theme colour of a tone, for drawing. */
export function toneColor(tone: Tone | 'info' | undefined): string {
  return TONE_COLORS[tone ?? 'info'];
}

type Bar = {
  label: string;
  /** Stacked from the bottom, in the order given. */
  values: number[];
};

type BarChartProps = {
  bars: Bar[];
  series: { label: string; tone: Tone | 'info' }[];
  height?: number;
  /** Describes the chart for screen readers. */
  title: string;
};

/** Stacked bars, e.g. deployments per day. */
export const BarChart = ({
  bars,
  series,
  height = 120,
  title,
}: BarChartProps) => {
  const max = Math.max(
    1,
    ...bars.map(bar => bar.values.reduce((a, b) => a + b, 0)),
  );
  const width = 100;
  const gap = bars.length > 40 ? 0.15 : 0.25;
  const step = width / Math.max(1, bars.length);

  return (
    <Flex direction="column" gap="2">
      <svg
        role="img"
        aria-label={title}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
      >
        <title>{title}</title>
        <line
          x1={0}
          x2={width}
          y1={height - 0.5}
          y2={height - 0.5}
          stroke="var(--bui-border-1)"
          vectorEffect="non-scaling-stroke"
        />
        {bars.map((bar, i) => {
          let y = height;
          return (
            <g key={i}>
              <title>
                {`${bar.label}: ${bar.values
                  .map((v, s) => `${v} ${series[s]?.label ?? ''}`)
                  .join(', ')}`}
              </title>
              {bar.values.map((value, s) => {
                const h = (value / max) * (height - 4);
                y -= h;
                return value ? (
                  <rect
                    key={s}
                    x={i * step + (step * gap) / 2}
                    y={y}
                    width={step * (1 - gap)}
                    height={h}
                    rx={0.6}
                    fill={toneColor(series[s]?.tone)}
                  />
                ) : null;
              })}
            </g>
          );
        })}
      </svg>
      <Flex justify="between" gap="2">
        <Text variant="body-x-small" color="secondary">
          {bars[0]?.label}
        </Text>
        <Flex gap="3">
          {series.map(s => (
            <Text key={s.label} variant="body-x-small" color="secondary">
              <span style={{ color: toneColor(s.tone) }} aria-hidden>
                ■{' '}
              </span>
              {s.label}
            </Text>
          ))}
        </Flex>
        <Text variant="body-x-small" color="secondary">
          {bars[bars.length - 1]?.label}
        </Text>
      </Flex>
    </Flex>
  );
};

/** A line over time, e.g. an error budget. A dashed line marks zero. */
export const Sparkline = ({
  values,
  tone,
  title,
  height = 32,
}: {
  values: number[];
  tone: Tone | 'info';
  title: string;
  height?: number;
}) => {
  if (values.length < 2) return null;
  const width = 100;
  const min = Math.min(0, ...values);
  const max = Math.max(...values, min + 1);
  const y = (v: number) =>
    height - 2 - ((v - min) / (max - min)) * (height - 4);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * width},${y(v)}`)
    .join(' ');

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
    >
      <title>{title}</title>
      {min < 0 ? (
        <line
          x1={0}
          x2={width}
          y1={y(0)}
          y2={y(0)}
          stroke={toneColor('danger')}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <polyline
        points={points}
        fill="none"
        stroke={toneColor(tone)}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/** Two values side by side as bars, e.g. AI assisted versus other work. */
export const CompareBars = ({
  rows,
  format,
}: {
  rows: { label: string; value: number | null; tone: Tone | 'info' }[];
  format: (value: number | null) => string;
}) => {
  const max = Math.max(1e-9, ...rows.map(r => Math.abs(r.value ?? 0)));
  return (
    <Flex direction="column" gap="1">
      {rows.map(row => (
        <Flex key={row.label} align="center" gap="2">
          <Text
            variant="body-x-small"
            color="secondary"
            style={{ width: 72, flexShrink: 0 }}
          >
            {row.label}
          </Text>
          <div
            aria-hidden
            style={{
              flex: 1,
              height: 8,
              borderRadius: 'var(--bui-radius-full)',
              background: 'var(--bui-bg-neutral-2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(Math.abs(row.value ?? 0) / max) * 100}%`,
                height: '100%',
                background: toneColor(row.tone),
              }}
            />
          </div>
          <Text
            variant="body-x-small"
            weight="bold"
            style={{ width: 64, textAlign: 'right', flexShrink: 0 }}
          >
            {format(row.value)}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
};
