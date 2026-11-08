import { useState } from 'react';
import { Flex, Text } from '@backstage/ui';
import type { KudosFlows } from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { seriesColor } from './TimeChart';

// Who gave kudos to whom, as the Sankey diagram of the Kudos page of Agile
// Analytics: givers on the left, receivers on the right, each band as wide as
// the kudos it carries.

const NODE_WIDTH = 10;
// Room for a name between two nodes, however few kudos they carry
const NODE_GAP = 14;
const ROW_HEIGHT = 32;
const LABEL_WIDTH = 160;

export type SankeyNode = {
  name: string;
  total: number;
  y: number;
  height: number;
  color: string;
};

export type SankeyLink = {
  from: string;
  to: string;
  kudos: number;
  /** Where the band leaves the giver and reaches the receiver, its top. */
  y0: number;
  y1: number;
  width: number;
  color: string;
};

/** Places givers and receivers, most kudos first, and the bands between. */
export function sankeyLayout(flows: KudosFlows['flows'], height: number) {
  const totals = (key: 'from' | 'to') => {
    const sums = new Map<string, number>();
    for (const flow of flows) {
      sums.set(flow[key], (sums.get(flow[key]) ?? 0) + flow.kudos);
    }
    return [...sums].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  const givers = totals('from');
  const receivers = totals('to');
  const total = flows.reduce((sum, flow) => sum + flow.kudos, 0) || 1;
  const rows = Math.max(givers.length, receivers.length);
  // One scale for both sides, so a band is as wide at both ends
  const scale = (height - NODE_GAP * Math.max(0, rows - 1)) / total;

  const place = (side: [string, number][], colorOf: (i: number) => string) => {
    // A side with fewer people is centred
    const used =
      side.reduce((sum, [, t]) => sum + t * scale, 0) +
      NODE_GAP * Math.max(0, side.length - 1);
    let y = (height - used) / 2;
    return new Map(
      side.map(([name, t], i) => {
        const node = {
          name,
          total: t,
          y,
          height: t * scale,
          color: colorOf(i),
        };
        y += node.height + NODE_GAP;
        return [name, node];
      }),
    );
  };
  const left = place(givers, seriesColor);
  const right = place(receivers, () => 'var(--bui-fg-secondary)');

  // Bands leave and reach each node in the order of the other side's nodes,
  // so they cross as little as possible
  const order = (side: Map<string, SankeyNode>) => [...side.keys()];
  const rightOrder = order(right);
  const leftOrder = order(left);
  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const sorted = [...flows].sort(
    (a, b) =>
      leftOrder.indexOf(a.from) - leftOrder.indexOf(b.from) ||
      rightOrder.indexOf(a.to) - rightOrder.indexOf(b.to),
  );
  const links: SankeyLink[] = sorted.map(flow => {
    const from = left.get(flow.from)!;
    const width = flow.kudos * scale;
    const y0 = from.y + (outOffset.get(flow.from) ?? 0);
    outOffset.set(flow.from, (outOffset.get(flow.from) ?? 0) + width);
    return { ...flow, y0, y1: 0, width, color: from.color };
  });
  [...links]
    .sort(
      (a, b) =>
        rightOrder.indexOf(a.to) - rightOrder.indexOf(b.to) ||
        leftOrder.indexOf(a.from) - leftOrder.indexOf(b.from),
    )
    .forEach(link => {
      const to = right.get(link.to)!;
      link.y1 = to.y + (inOffset.get(link.to) ?? 0);
      inOffset.set(link.to, (inOffset.get(link.to) ?? 0) + link.width);
    });

  return { givers: [...left.values()], receivers: [...right.values()], links };
}

/** A band from x0 to x1 with straight ends and an S-curve between. */
function bandPath(link: SankeyLink, x0: number, x1: number) {
  const mid = (x0 + x1) / 2;
  const top = `M${x0},${link.y0} C${mid},${link.y0} ${mid},${link.y1} ${x1},${link.y1}`;
  const bottom0 = link.y0 + link.width;
  const bottom1 = link.y1 + link.width;
  return `${top} L${x1},${bottom1} C${mid},${bottom1} ${mid},${bottom0} ${x0},${bottom0} Z`;
}

export const KudosSankey = ({ flows }: { flows: KudosFlows['flows'] }) => {
  const [focus, setFocus] = useState<{
    side: 'from' | 'to';
    name: string;
  } | null>(null);
  const rows = Math.max(
    new Set(flows.map(f => f.from)).size,
    new Set(flows.map(f => f.to)).size,
  );
  const height = Math.max(120, rows * ROW_HEIGHT);
  const { givers, receivers, links } = sankeyLayout(flows, height);
  // The bands are drawn in a 1000 wide box between the label columns
  const width = 1000;
  const x0 = NODE_WIDTH;
  const x1 = width - NODE_WIDTH;
  const lit = (link: SankeyLink) => !focus || link[focus.side] === focus.name;
  // Pointing at someone brightens their bands and fades the others
  const bandOpacity = (link: SankeyLink) => {
    if (!focus) return 0.35;
    return lit(link) ? 0.6 : 0.08;
  };

  const label = (node: SankeyNode, side: 'from' | 'to') => (
    <div
      key={node.name}
      style={{
        position: 'absolute',
        top: node.y + node.height / 2,
        transform: 'translateY(-50%)',
        [side === 'from' ? 'right' : 'left']: 0,
        width: LABEL_WIDTH - 8,
        textAlign: side === 'from' ? 'right' : 'left',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'default',
        opacity:
          !focus || (focus.side === side && focus.name === node.name) ? 1 : 0.5,
      }}
      onMouseEnter={() => setFocus({ side, name: node.name })}
      onMouseLeave={() => setFocus(null)}
      title={`${node.name}: ${node.total} kudos ${
        side === 'from' ? 'given' : 'received'
      }`}
    >
      <Text variant="body-x-small">
        {node.name}{' '}
        <Text variant="body-x-small" color="secondary">
          {node.total}
        </Text>
      </Text>
    </div>
  );

  return (
    <Flex direction="column" gap="2">
      <Flex justify="between">
        <Text variant="body-x-small" color="secondary" weight="bold">
          GAVE KUDOS
        </Text>
        <Text variant="body-x-small" color="secondary" weight="bold">
          RECEIVED KUDOS
        </Text>
      </Flex>
      <div style={{ display: 'flex', width: '100%', height }}>
        <div
          style={{ position: 'relative', width: LABEL_WIDTH, flexShrink: 0 }}
        >
          {givers.map(node => label(node, 'from'))}
        </div>
        <svg
          role="img"
          aria-label={`Kudos given between ${givers.length} givers and ${receivers.length} receivers`}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          width="100%"
          height={height}
          style={{ flex: 1, minWidth: 0, display: 'block' }}
        >
          {links.map(link => (
            <path
              key={`${link.from}\u0000${link.to}`}
              d={bandPath(link, x0, x1)}
              fill={link.color}
              fillOpacity={bandOpacity(link)}
              style={{ transition: 'fill-opacity 150ms' }}
              onMouseEnter={() => setFocus({ side: 'from', name: link.from })}
              onMouseLeave={() => setFocus(null)}
            >
              <title>{`${link.from} gave ${link.to} ${link.kudos} kudos`}</title>
            </path>
          ))}
          {givers.map(node => (
            <rect
              key={node.name}
              x={0}
              y={node.y}
              width={NODE_WIDTH}
              height={Math.max(1, node.height)}
              fill={node.color}
            />
          ))}
          {receivers.map(node => (
            <rect
              key={node.name}
              x={width - NODE_WIDTH}
              y={node.y}
              width={NODE_WIDTH}
              height={Math.max(1, node.height)}
              fill={node.color}
            />
          ))}
        </svg>
        <div
          style={{ position: 'relative', width: LABEL_WIDTH, flexShrink: 0 }}
        >
          {receivers.map(node => label(node, 'to'))}
        </div>
      </div>
    </Flex>
  );
};
