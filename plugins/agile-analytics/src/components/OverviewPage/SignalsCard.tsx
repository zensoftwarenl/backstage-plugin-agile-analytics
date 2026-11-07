import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Link,
  Skeleton,
  Text,
} from '@backstage/ui';
import type { Signal } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { describeSignal } from '../../health';
import { overviewUrl } from '../../links';

const MAX_SIGNALS = 8;

type SignalsCardProps = {
  signals?: Signal[];
  loading: boolean;
  error?: Error;
};

export const SignalsCard = ({ signals, loading, error }: SignalsCardProps) => {
  if (loading) {
    return <Skeleton width="100%" height={160} />;
  }
  if (error) {
    return (
      <Alert
        status="warning"
        title="Could not load recent signals"
        description={error.message}
      />
    );
  }

  const items = Array.isArray(signals) ? signals : [];
  const shown = items.slice(0, MAX_SIGNALS);

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small" as="h2">
          Recent signals
        </Text>
        <Text variant="body-small" color="secondary">
          What changed in the last two weeks, found every morning
        </Text>
      </CardHeader>
      <CardBody>
        {shown.length ? (
          <Flex direction="column" gap="2">
            {shown.map((signal, index) => {
              const { text, good, url } = describeSignal(signal);
              return (
                <Flex key={index} gap="2" align="center">
                  <Text color={good ? 'success' : 'warning'} aria-hidden>
                    ●
                  </Text>
                  {url ? (
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                      {text}
                    </Link>
                  ) : (
                    <Text>{text}</Text>
                  )}
                </Flex>
              );
            })}
            {items.length > shown.length ? (
              <Link
                href={overviewUrl()}
                target="_blank"
                rel="noopener noreferrer"
                variant="body-small"
                color="secondary"
              >
                …and {items.length - shown.length} more in Agile Analytics
              </Link>
            ) : null}
          </Flex>
        ) : (
          <Text color="secondary">Nothing moved in the last two weeks.</Text>
        )}
      </CardBody>
    </Card>
  );
};
