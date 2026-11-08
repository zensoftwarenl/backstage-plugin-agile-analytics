import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Flex, Text } from '@backstage/ui';
import { formatDate } from '../format';

// A chart of values over time, drawn in pixels so dots stay round and text
// stays sharp: lines (an error budget) or dots (a lead time per change), with
// a hover readout, reference lines and time markers.

/** Categorical colours, the series colours of the Agile Analytics app. */
export const SERIES_COLORS = [
  '#1fb8d3',
  '#4c72bd',
  '#f2a33a',
  '#e05c7a',
  '#8e6bd6',
  '#2fa58c',
  '#81bc42',
  '#c96a3b',
  '#5c9be0',
  '#e8c547',
  '#7b8294',
  '#d6da33',
];

export const seriesColor = (index: number) =>
  SERIES_COLORS[index % SERIES_COLORS.length];

export type TimeSeries = {
  key: string;
  name: string;
  color: string;
  /** [epoch milliseconds, value]; a null value breaks the line. */
  points: [number, number | null][];
  /** Dots instead of a line. */
  dots?: boolean;
  /** More about the series, under its name in the hover readout. */
  description?: string;
};

export type TimeMarker = { time: number; label: string; color: string };

export type ReferenceLine = { value: number; label: string; color: string };

type TimeChartProps = {
  series: TimeSeries[];
  /** Describes the chart for screen readers. */
  title: string;
  height?: number;
  formatValue?: (value: number) => string;
  /** Keeps the axis from 0, e.g. for durations. */
  fromZero?: boolean;
  /** A dashed red line at 0 when the values go below it. */
  zeroLine?: boolean;
  references?: ReferenceLine[];
  markers?: TimeMarker[];
  /** Names the markers in the legend, where they can be hidden. */
  markersLabel?: string;
  /** The stretch of time on the axis; the data's own when missing. */
  domain?: [number, number];
  /** Off where a single series needs no legend. */
  legend?: boolean;
  /** Below each series' value in the readout, e.g. the repository of a dot. */
  pointNote?: (series: TimeSeries, point: [number, number | null]) => ReactNode;
};

const GUTTER = 52;
const PAD_TOP = 8;
const PAD_BOTTOM = 22;
/** How close the pointer must come to a dot to show it, in pixels. */
const DOT_REACH = 10;

/** The width of an element, following it as it resizes. */
function useWidth(fallback = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (node.clientWidth) setWidth(node.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width;
      if (next) setWidth(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Round axis ticks from at or below `min` to at or above `max`. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(s => s >= raw) ??
    10 * magnitude;
  const ticks: number[] = [];
  const first = Math.floor(min / step);
  for (
    let i = first;
    ticks[ticks.length - 1] === undefined || ticks[ticks.length - 1] < max;
    i++
  ) {
    // `|| 0` turns -0 into 0
    ticks.push(Math.round(i * step * 1e6) / 1e6 || 0);
  }
  return ticks;
}

/**
 * At most two points per `slots`: the lowest and highest of each, so dips
 * still show when a month of half-hourly reports is drawn a few hundred
 * pixels wide.
 */
export function thinPoints(
  points: [number, number | null][],
  slots: number,
): [number, number | null][] {
  if (points.length <= slots * 2) return points;
  const first = points[0][0];
  const span = points[points.length - 1][0] - first || 1;
  const kept: [number, number | null][] = [];
  let slot = -1;
  let low: [number, number | null] | null = null;
  let high: [number, number | null] | null = null;
  const flush = () => {
    if (low && high) {
      if (low === high) kept.push(low);
      else kept.push(...(low[0] < high[0] ? [low, high] : [high, low]));
    }
  };
  for (const point of points) {
    const s = Math.min(
      slots - 1,
      Math.floor(((point[0] - first) / span) * slots),
    );
    if (s !== slot || point[1] === null) {
      flush();
      slot = s;
      low = high = null;
      if (point[1] === null) {
        kept.push(point);
        continue;
      }
    }
    if (!low || point[1]! < low[1]!) low = point;
    if (!high || point[1]! > high[1]!) high = point;
  }
  flush();
  return kept;
}

/** The point of a series nearest to a time. */
function nearest(points: [number, number | null][], time: number) {
  let best: [number, number | null] | undefined;
  for (const point of points) {
    if (point[1] === null) continue;
    if (!best || Math.abs(point[0] - time) < Math.abs(best[0] - time)) {
      best = point;
    }
  }
  return best;
}

/** A series in the legend; a click hides or shows it. */
const LegendButton = ({
  label,
  color,
  description,
  off,
  onToggle,
}: {
  label: string;
  color: string;
  description?: string;
  off: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-pressed={!off}
    title={description}
    onClick={onToggle}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 8px',
      border: '1px solid var(--bui-border-1)',
      borderRadius: 'var(--bui-radius-full)',
      background: 'transparent',
      color: 'inherit',
      font: 'inherit',
      cursor: 'pointer',
      opacity: off ? 0.45 : 1,
    }}
  >
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: off ? 'transparent' : color,
        border: `2px solid ${color}`,
      }}
    />
    <Text variant="body-x-small">{label}</Text>
  </button>
);

export const TimeChart = ({
  series,
  title,
  height = 220,
  formatValue = v => String(Math.round(v * 100) / 100),
  fromZero = false,
  zeroLine = false,
  references = [],
  markers: allMarkers = [],
  markersLabel,
  domain,
  legend = true,
  pointNote,
}: TimeChartProps) => {
  const [ref, width] = useWidth();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<number | null>(null);
  const [markersHidden, setMarkersHidden] = useState(false);
  const markers = markersHidden ? [] : allMarkers;
  // New series: show them all again
  const keys = series.map(s => s.key).join('\u0000');
  useEffect(() => setHidden(new Set()), [keys]);

  const plotWidth = Math.max(40, width - GUTTER);
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;
  const shown = series.filter(s => !hidden.has(s.key));

  const scale = useMemo(() => {
    const times = series.flatMap(s => s.points.map(p => p[0]));
    const values = shown.flatMap(s =>
      s.points.map(p => p[1]).filter((v): v is number => v !== null),
    );
    values.push(...references.map(r => r.value));
    if (fromZero || zeroLine) values.push(0);
    const [t0, t1] = domain ?? [Math.min(...times), Math.max(...times)];
    let v0 = values.length ? Math.min(...values) : 0;
    let v1 = values.length ? Math.max(...values) : 1;
    if (v1 === v0) {
      v1 += 1;
      v0 -= v0 === 0 ? 0 : 1;
    }
    const ticks = niceTicks(v0, v1);
    v0 = Math.min(v0, ticks[0]);
    v1 = Math.max(v1, ticks[ticks.length - 1]);
    const span = t1 - t0 || 1;
    return {
      t0,
      t1,
      ticks,
      x: (t: number) => ((t - t0) / span) * plotWidth,
      y: (v: number) =>
        PAD_TOP + plotHeight - ((v - v0) / (v1 - v0)) * plotHeight,
      time: (x: number) => t0 + (x / plotWidth) * span,
    };
  }, [
    series,
    shown,
    references,
    fromZero,
    zeroLine,
    domain,
    plotWidth,
    plotHeight,
  ]);

  const drawn = useMemo(
    () =>
      shown.map(s => ({
        ...s,
        points: s.dots
          ? s.points
          : thinPoints(
              [...s.points].sort((a, b) => a[0] - b[0]),
              Math.ceil(plotWidth / 2),
            ),
      })),
    [shown, plotWidth],
  );

  if (!series.some(s => s.points.length)) return null;

  const hoverTime = hover === null ? null : scale.time(hover);
  const readout =
    hoverTime === null
      ? []
      : drawn
          .map(s => ({ series: s, point: nearest(s.points, hoverTime) }))
          .filter(
            (r): r is { series: TimeSeries; point: [number, number | null] } =>
              !!r.point &&
              (!r.series.dots ||
                Math.abs(scale.x(r.point[0]) - hover!) <= DOT_REACH),
          );
  const nearMarkers =
    hover === null
      ? []
      : markers.filter(m => Math.abs(scale.x(m.time) - hover) <= DOT_REACH);
  const readoutTime = readout[0]?.point[0] ?? nearMarkers[0]?.time ?? hoverTime;
  const flip = hover !== null && hover > plotWidth / 2;

  return (
    <Flex direction="column" gap="2">
      <div
        ref={ref}
        style={{ position: 'relative', width: '100%', height }}
        onMouseMove={e => {
          const box = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - box.left - GUTTER;
          setHover(x >= 0 && x <= plotWidth ? x : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          role="img"
          aria-label={title}
          width={width}
          height={height}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <title>{title}</title>
          <g fontSize={11} fill="var(--bui-fg-secondary)">
            {scale.ticks.map(tick => (
              <g key={tick}>
                <line
                  x1={GUTTER}
                  x2={GUTTER + plotWidth}
                  y1={scale.y(tick)}
                  y2={scale.y(tick)}
                  stroke="var(--bui-border-1)"
                  strokeOpacity={0.6}
                />
                <text
                  x={GUTTER - 6}
                  y={scale.y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatValue(tick)}
                </text>
              </g>
            ))}
            {[scale.t0, (scale.t0 + scale.t1) / 2, scale.t1].map((t, i) => (
              <text
                key={i}
                x={GUTTER + scale.x(t)}
                y={height - 6}
                textAnchor={(['start', 'middle', 'end'] as const)[i]}
              >
                {formatDate(t / 1000)}
              </text>
            ))}
          </g>
          <g transform={`translate(${GUTTER},0)`}>
            {markers.map((marker, i) => (
              <g key={i}>
                <title>{marker.label}</title>
                <line
                  x1={scale.x(marker.time)}
                  x2={scale.x(marker.time)}
                  y1={PAD_TOP}
                  y2={PAD_TOP + plotHeight}
                  stroke={marker.color}
                  strokeOpacity={0.5}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={scale.x(marker.time)}
                  cy={PAD_TOP}
                  r={3}
                  fill={marker.color}
                />
              </g>
            ))}
            {zeroLine && scale.ticks[0] < 0 ? (
              <line
                x1={0}
                x2={plotWidth}
                y1={scale.y(0)}
                y2={scale.y(0)}
                stroke="var(--bui-fg-negative)"
                strokeDasharray="4 3"
              />
            ) : null}
            {references.map(reference => (
              <g key={reference.label}>
                <line
                  x1={0}
                  x2={plotWidth}
                  y1={scale.y(reference.value)}
                  y2={scale.y(reference.value)}
                  stroke={reference.color}
                  strokeDasharray="6 4"
                />
                <text
                  x={plotWidth - 4}
                  y={scale.y(reference.value) - 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={reference.color}
                >
                  {reference.label}
                </text>
              </g>
            ))}
            {drawn.map(s =>
              s.dots ? (
                <g key={s.key} fill={s.color} fillOpacity={0.75}>
                  {s.points.map((p, i) =>
                    p[1] === null ? null : (
                      <circle
                        key={i}
                        cx={scale.x(p[0])}
                        cy={scale.y(p[1])}
                        r={3}
                      />
                    ),
                  )}
                </g>
              ) : (
                <path
                  key={s.key}
                  d={s.points
                    .map((p, i, all) =>
                      p[1] === null
                        ? ''
                        : `${
                            i === 0 || all[i - 1][1] === null ? 'M' : 'L'
                          }${scale.x(p[0]).toFixed(1)},${scale
                            .y(p[1])
                            .toFixed(1)}`,
                    )
                    .join('')}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.75}
                  strokeLinejoin="round"
                />
              ),
            )}
            {hover !== null ? (
              <g pointerEvents="none">
                <line
                  x1={scale.x(readoutTime!)}
                  x2={scale.x(readoutTime!)}
                  y1={PAD_TOP}
                  y2={PAD_TOP + plotHeight}
                  stroke="var(--bui-fg-secondary)"
                  strokeOpacity={0.5}
                />
                {readout.map(({ series: s, point }) => (
                  <circle
                    key={s.key}
                    cx={scale.x(point[0])}
                    cy={scale.y(point[1]!)}
                    r={4}
                    fill={s.color}
                    stroke="var(--bui-bg-neutral-1)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            ) : null}
          </g>
        </svg>
        {hover !== null && (readout.length || nearMarkers.length) ? (
          <div
            role="status"
            style={{
              position: 'absolute',
              top: PAD_TOP,
              [flip ? 'right' : 'left']: flip
                ? width - GUTTER - hover + 12
                : GUTTER + hover + 12,
              maxWidth: 280,
              padding: '6px 10px',
              borderRadius: 'var(--bui-radius-2)',
              background: 'var(--bui-bg-neutral-1)',
              border: '1px solid var(--bui-border-1)',
              boxShadow: '0 2px 8px rgb(0 0 0 / 15%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <Text variant="body-x-small" color="secondary" as="p">
              {new Date(readoutTime!).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {readout.map(({ series: s, point }) => (
              <Flex key={s.key} direction="column" gap="0">
                <Flex align="center" gap="2" justify="between">
                  <Text variant="body-x-small" truncate>
                    <span style={{ color: s.color }} aria-hidden>
                      ●{' '}
                    </span>
                    {s.name}
                  </Text>
                  <Text variant="body-x-small" weight="bold">
                    {formatValue(point[1]!)}
                  </Text>
                </Flex>
                {pointNote ? (
                  <Text variant="body-x-small" color="secondary">
                    {pointNote(s, point)}
                  </Text>
                ) : null}
              </Flex>
            ))}
            {nearMarkers.map((marker, i) => (
              <Text key={i} variant="body-x-small" as="p">
                <span style={{ color: marker.color }} aria-hidden>
                  ●{' '}
                </span>
                {marker.label}
              </Text>
            ))}
          </div>
        ) : null}
      </div>
      {(legend && series.length > 1) || (markersLabel && allMarkers.length) ? (
        <Flex
          gap="1"
          style={{ flexWrap: 'wrap' }}
          role="group"
          aria-label="Series"
        >
          {(legend && series.length > 1 ? series : []).map(s => (
            <LegendButton
              key={s.key}
              label={s.name}
              color={s.color}
              description={s.description}
              off={hidden.has(s.key)}
              onToggle={() =>
                setHidden(previous => {
                  const next = new Set(previous);
                  if (next.has(s.key)) next.delete(s.key);
                  else next.add(s.key);
                  return next;
                })
              }
            />
          ))}
          {markersLabel && allMarkers.length ? (
            <LegendButton
              label={markersLabel}
              color={allMarkers[0].color}
              off={markersHidden}
              onToggle={() => setMarkersHidden(off => !off)}
            />
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  );
};
