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
  /** A `color` overrides the tone's, for series that are not good or bad. */
  series: { label: string; tone: Tone | 'info'; color?: string }[];
  height?: number;
  /** Describes the chart for screen readers. */
  title: string;
  /**
   * A line over the bars on a scale of its own, e.g. the lead time per week
   * over the work merged; a null value breaks it.
   */
  line?: {
    label: string;
    color: string;
    values: (number | null)[];
    format: (value: number) => string;
  };
};

/** Stacked bars, e.g. deployments per day. */
export const BarChart = ({
  bars,
  series,
  height = 120,
  title,
  line,
}: BarChartProps) => {
  const max = Math.max(
    1,
    ...bars.map(bar => bar.values.reduce((a, b) => a + b, 0)),
  );
  const width = 100;
  const gap = bars.length > 40 ? 0.15 : 0.25;
  const step = width / Math.max(1, bars.length);
  const lineValues = (line?.values ?? []).filter(
    (v): v is number => v !== null,
  );
  const lineMax = Math.max(1e-9, ...lineValues) * 1.1;
  const linePath = line
    ? line.values
        .map((v, i, all) =>
          v === null
            ? ''
            : `${i === 0 || all[i - 1] === null ? 'M' : 'L'}${
                i * step + step / 2
              },${height - 2 - (v / lineMax) * (height - 6)}`,
        )
        .join('')
    : '';

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
                  .join(', ')}${
                  line &&
                  line.values[i] !== null &&
                  line.values[i] !== undefined
                    ? `, ${line.label} ${line.format(line.values[i]!)}`
                    : ''
                }`}
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
                    fill={series[s]?.color ?? toneColor(series[s]?.tone)}
                  />
                ) : null;
              })}
            </g>
          );
        })}
        {line ? (
          <path
            d={linePath}
            fill="none"
            stroke={line.color}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ) : null}
      </svg>
      <Flex justify="between" gap="2">
        <Text variant="body-x-small" color="secondary">
          {bars[0]?.label}
        </Text>
        <Flex gap="3">
          {series.map(s => (
            <Text key={s.label} variant="body-x-small" color="secondary">
              <span style={{ color: s.color ?? toneColor(s.tone) }} aria-hidden>
                ■{' '}
              </span>
              {s.label}
            </Text>
          ))}
          {line ? (
            <Text variant="body-x-small" color="secondary">
              <span style={{ color: line.color }} aria-hidden>
                ━{' '}
              </span>
              {line.label} (up to {line.format(Math.max(0, ...lineValues))})
            </Text>
          ) : null}
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

/** A ring of slices with the total in the middle, e.g. tickets per type. */
export const Donut = ({
  slices,
  title,
  format = value => String(value),
  size = 140,
}: {
  slices: { label: string; value: number; color: string }[];
  title: string;
  format?: (value: number) => string;
  size?: number;
}) => {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <Flex align="center" gap="4" style={{ flexWrap: 'wrap' }}>
      <svg
        role="img"
        aria-label={`${title}: ${slices
          .map(s => `${s.label} ${format(s.value)}`)
          .join(', ')}`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bui-bg-neutral-2)"
          strokeWidth={20}
        />
        {total
          ? slices.map(slice => {
              const length = (slice.value / total) * circumference;
              const dash = (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={20}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                >
                  <title>{`${slice.label}: ${format(slice.value)}`}</title>
                </circle>
              );
              offset += length;
              return dash;
            })
          : null}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fontWeight={600}
          fill="var(--bui-fg-primary)"
        >
          {format(total)}
        </text>
      </svg>
      <Flex direction="column" gap="1">
        {slices.map(slice => (
          <Text key={slice.label} variant="body-small">
            <span style={{ color: slice.color }} aria-hidden>
              ■{' '}
            </span>
            {slice.label}{' '}
            <Text as="span" variant="body-small" weight="bold">
              {format(slice.value)}
            </Text>{' '}
            <Text as="span" variant="body-x-small" color="secondary">
              {total ? `${Math.round((slice.value / total) * 100)}%` : ''}
            </Text>
          </Text>
        ))}
      </Flex>
    </Flex>
  );
};

/** One of a few choices, e.g. which metric a chart shows. */
export function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: 2,
        padding: 2,
        borderRadius: 'var(--bui-radius-2)',
        background: 'var(--bui-bg-neutral-2)',
      }}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          style={{
            padding: '2px 10px',
            border: 0,
            borderRadius: 'var(--bui-radius-2)',
            background:
              option.value === value
                ? 'var(--bui-bg-neutral-1)'
                : 'transparent',
            color: 'inherit',
            font: 'inherit',
            fontSize: 12,
            fontWeight: option.value === value ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
