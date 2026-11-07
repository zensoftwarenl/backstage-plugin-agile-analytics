import { Flex, Text } from '@backstage/ui';
import type { ReactNode } from 'react';
import type { Tone } from '../health';

type KpiTileProps = {
  label: string;
  value: string;
  /** Colours the value; neutral when missing. */
  tone?: Tone | 'info';
  /** A short line under the value, e.g. a benchmark or a comparison. */
  hint?: ReactNode;
  hintTone?: Tone | 'info' | 'secondary';
  title?: string;
};

/** One headline number. */
export const KpiTile = ({
  label,
  value,
  tone,
  hint,
  hintTone = 'secondary',
  title,
}: KpiTileProps) => (
  <Flex
    direction="column"
    gap="1"
    p="3"
    title={title}
    role="group"
    aria-label={`${label}: ${value}`}
    style={{
      border: '1px solid var(--bui-border-1)',
      borderRadius: 'var(--bui-radius-3)',
      minWidth: 0,
    }}
  >
    <Text variant="body-small" color="secondary" truncate>
      {label}
    </Text>
    <Text variant="title-medium" weight="bold" color={tone ?? 'primary'}>
      {value}
    </Text>
    {hint ? (
      <Text variant="body-x-small" color={hintTone}>
        {hint}
      </Text>
    ) : null}
  </Flex>
);
