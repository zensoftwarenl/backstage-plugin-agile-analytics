import { Text } from '@backstage/ui';
import type { CSSProperties, ReactNode } from 'react';

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
  width?: CSSProperties['width'];
};

const cell: CSSProperties = {
  padding: 'var(--bui-space-2) var(--bui-space-3)',
  borderBottom: '1px solid var(--bui-border-1)',
  verticalAlign: 'top',
};

/** A plain, compact table for read-only rows. */
export function SimpleTable<T>({
  columns,
  rows,
  rowKey,
  label,
  empty = 'Nothing to show',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  label: string;
  empty?: string;
}) {
  if (!rows.length) {
    return <Text color="secondary">{empty}</Text>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        aria-label={label}
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                scope="col"
                style={{
                  ...cell,
                  textAlign: column.align ?? 'left',
                  width: column.width,
                  whiteSpace: 'nowrap',
                }}
              >
                <Text variant="body-x-small" color="secondary" weight="bold">
                  {column.label}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={rowKey(row)}>
              {columns.map(column => (
                <td
                  key={column.key}
                  style={{ ...cell, textAlign: column.align ?? 'left' }}
                >
                  <Text variant="body-small" as="div">
                    {column.render(row)}
                  </Text>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
