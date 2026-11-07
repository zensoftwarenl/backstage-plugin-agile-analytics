// Formatting shared by the tabs. Missing values read as an en dash, like the
// rest of the plugin.

const DASH = '–';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A duration in seconds as minutes, hours or days, e.g. `3.5 h`. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!finite(seconds)) return DASH;
  const abs = Math.abs(seconds);
  const sign = seconds < 0 ? '-' : '';
  if (abs < 3600) return `${sign}${Math.round(abs / 60)} min`;
  if (abs < 86_400) return `${sign}${Math.round((abs / 3600) * 10) / 10} h`;
  return `${sign}${Math.round((abs / 86_400) * 10) / 10} d`;
}

/** A duration in hours, e.g. `5.2 h` or `3.1 d`. */
export function formatHours(hours: number | null | undefined): string {
  return finite(hours) ? formatDuration(hours * 3600) : DASH;
}

/** A fraction as a percentage, e.g. 0.425 as `42.5%`. */
export function formatShare(fraction: number | null | undefined): string {
  return finite(fraction) ? `${Math.round(fraction * 1000) / 10}%` : DASH;
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (!finite(value)) return DASH;
  return value.toLocaleString('en-GB', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

export function formatMoney(
  value: number | null | undefined,
  currency = 'EUR',
): string {
  if (!finite(value)) return DASH;
  try {
    return value.toLocaleString('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  } catch {
    // An unknown currency code
    return `${formatNumber(value)} ${currency}`;
  }
}

/** Epoch seconds as a short date, e.g. `29 Oct`. */
export function formatDate(epochSeconds: number | null | undefined): string {
  if (!finite(epochSeconds)) return DASH;
  return new Date(epochSeconds * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** The repository's name without host or `.git`, e.g. `acme/agile`. */
export function repositoryName(repository: string): string {
  return repository
    .trim()
    .replace(/^git@[^:]+:/, '')
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
}

export function mean(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
