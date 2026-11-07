import { Alert, Card, CardBody, Skeleton, Text } from '@backstage/ui';
import type { ReactNode } from 'react';

/**
 * Shows a skeleton while loading, an alert on errors and `empty` when there is
 * no data; otherwise its children.
 */
export const LoadState = ({
  loading,
  error,
  what,
  isEmpty,
  empty,
  height = 160,
  children,
}: {
  loading: boolean;
  error?: Error;
  /** What failed to load, e.g. `the DORA metrics`. */
  what: string;
  isEmpty?: boolean;
  empty?: ReactNode;
  height?: number;
  children: () => ReactNode;
}) => {
  if (loading) return <Skeleton width="100%" height={height} />;
  if (error) {
    return (
      <Alert
        status="danger"
        title={`Could not load ${what}`}
        description={error.message}
      />
    );
  }
  if (isEmpty) {
    return (
      <Card>
        <CardBody>
          <Text color="secondary">{empty}</Text>
        </CardBody>
      </Card>
    );
  }
  return <>{children()}</>;
};
