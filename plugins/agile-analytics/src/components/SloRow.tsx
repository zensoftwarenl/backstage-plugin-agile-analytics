import { Flex, Link, Text } from '@backstage/ui';
import type {
  ErrorBudgetSeries,
  SloReportMetric,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { CopyLinkButton, deepLinkId } from '../deepLink';
import { formatDate } from '../format';
import { errorBudgetsUrl } from '../links';
import { budgetTone, formatPercent, formatTarget } from '../slos';
import { Sparkline } from './charts';
import { ScoreBar } from './ScoreBar';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** What a link to an SLO on the error budgets tab names */
export const sloTarget = (slo: SloReportMetric) => `slo/${slo.id}`;

/** One SLO with the error budget it has left. */
export const SloRow = ({
  slo,
  showService = true,
  series,
  linkable = false,
}: {
  slo: SloReportMetric;
  /** Off where the service is already clear, e.g. on its own entity page. */
  showService?: boolean;
  /** The budget over time; adds a trend line and the last weeks' budgets. */
  series?: ErrorBudgetSeries;
  /** With a link to copy, where the page scrolls to the SLO a link names */
  linkable?: boolean;
}) => {
  const points = (series?.data ?? []).map(point => point[1]);
  const weeks = (series?.history ?? []).filter(week => week.reports > 0);
  const budget = Number(slo.errorBudget);
  const tone = budgetTone(budget);

  return (
    <Flex
      direction="column"
      gap="1"
      data-slo={slo.id}
      id={linkable ? deepLinkId(sloTarget(slo)) : undefined}
      style={{ scrollMarginTop: 16 }}
    >
      <Flex justify="between" align="baseline" gap="2">
        <Flex align="baseline" gap="2">
          <Text variant="body-medium" weight="bold" truncate>
            {slo.sloName ?? 'Unnamed SLO'}
          </Text>
          {linkable ? (
            <span style={{ alignSelf: 'center' }}>
              <CopyLinkButton
                target={sloTarget(slo)}
                label={slo.sloName ?? 'the SLO'}
              />
            </span>
          ) : null}
          {showService && slo.service ? (
            <Link
              href={errorBudgetsUrl(slo.service)}
              {...external}
              variant="body-x-small"
              color="secondary"
            >
              {slo.service}
            </Link>
          ) : null}
        </Flex>
        <Text
          variant="body-medium"
          weight="bold"
          color={tone === 'danger' ? 'danger' : 'primary'}
          aria-label={`${formatPercent(budget)} error budget left`}
        >
          {formatPercent(budget)}
        </Text>
      </Flex>
      {/* A used-up budget shows as a full red bar */}
      <ScoreBar score={budget < 0 ? 100 : budget} tone={tone} />
      {points.length > 1 ? (
        <Sparkline
          values={points}
          tone={budgetTone(points[points.length - 1])}
          title={`Error budget of ${
            slo.sloName ?? 'the SLO'
          } over time, from ${formatPercent(points[0])} to ${formatPercent(
            points[points.length - 1],
          )}`}
        />
      ) : null}
      <Flex justify="between" gap="2">
        <Text variant="body-x-small" color="secondary">
          Measured {formatPercent(slo.sloValue)} against a target of{' '}
          {formatTarget(slo.sloTarget)}
        </Text>
        <Text variant="body-x-small" color={tone}>
          {budget < 0 ? 'Over budget' : 'Budget left'}
        </Text>
      </Flex>
      {weeks.length ? (
        <Flex gap="3" style={{ flexWrap: 'wrap' }} aria-label="Budget per week">
          {weeks.map(week => (
            <Text
              key={week.start}
              variant="body-x-small"
              color={
                week.remaining === null
                  ? 'secondary'
                  : budgetTone(week.remaining)
              }
            >
              Week of {formatDate(week.start)}: {formatPercent(week.remaining)}
            </Text>
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
};
