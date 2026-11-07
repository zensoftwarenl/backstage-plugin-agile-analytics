import { DORA_LABELS, DoraMetricId, doraBand } from '../dora';
import { formatDuration, formatHours, formatNumber } from '../format';
import { KpiTile } from './KpiTile';

/** A DORA metric in its own unit: df per day, lt in seconds, mttr in hours, cfr in percent. */
export function formatDoraValue(
  id: DoraMetricId,
  value: number | null,
): string {
  if (value === null) return '–';
  switch (id) {
    case 'df':
      return `${formatNumber(value, 2)} / day`;
    case 'lt':
      return formatDuration(value);
    case 'mttr':
      return formatHours(value);
    default:
      return `${formatNumber(value, 1)}%`;
  }
}

/** One DORA metric with its benchmark band. */
export const DoraTile = ({
  id,
  value,
}: {
  id: DoraMetricId;
  value: number | null;
}) => {
  const band = doraBand(id, value);
  return (
    <KpiTile
      label={DORA_LABELS[id]}
      value={formatDoraValue(id, value)}
      tone={band?.tone}
      hint={band ? `${band.label} performer` : 'No data'}
      hintTone={band?.tone ?? 'secondary'}
    />
  );
};
