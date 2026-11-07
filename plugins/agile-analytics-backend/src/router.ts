import { InputError } from '@backstage/errors';
import {
  AiCostAndReturn,
  COLLABORATION_WINDOWS,
  DoraData,
  PERIOD_DAYS,
  TREND_DAYS,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import express from 'express';
import Router from 'express-promise-router';
import type { AgileAnalyticsReader } from './AgileAnalyticsClient';
import { periodFor } from './period';

// Team hashes are opaque ids; anything else must not reach the upstream path
const TEAM_HASH = /^[A-Za-z0-9_-]{1,64}$/;
const DEFAULT_DAYS = 14;
const DEFAULT_WINDOW_DAYS = 730;

// Group or repository paths as Agile Analytics spells them, e.g. group/project
const NODE_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

function nodePath(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    value.length > 200 ||
    !NODE_PATH.test(value) ||
    value.split('/').some(part => part === '.' || part === '..')
  ) {
    throw new InputError(`Invalid repository or group '${value}'`);
  }
  return value.toLowerCase();
}

function teamHash(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !TEAM_HASH.test(value)) {
    throw new InputError(`Invalid team hash '${value}'`);
  }
  return value;
}

/** One of a fixed set of numbers, so queries stay cacheable. */
function oneOf(
  name: string,
  value: unknown,
  allowed: readonly number[],
  fallback: number,
): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!allowed.includes(n)) {
    throw new InputError(`${name} must be one of ${allowed.join(', ')}`);
  }
  return n;
}

function period(req: express.Request) {
  return periodFor(oneOf('days', req.query.days, PERIOD_DAYS, DEFAULT_DAYS));
}

/**
 * Only the endpoints the frontend needs are exposed, so the backend cannot be
 * used as an open proxy to the rest of the Agile Analytics API.
 */
export async function createRouter({
  client,
}: {
  client: AgileAnalyticsReader;
}): Promise<express.Router> {
  const router = Router();

  router.get('/organisation', async (_req, res) => {
    res.json(await client.getOrganisation());
  });

  router.get('/health', async (_req, res) => {
    res.json(await client.getHealth());
  });

  router.get('/teams', async (_req, res) => {
    res.json(await client.getTeams());
  });

  router.get('/teams/:teamHash/health', async (req, res) => {
    res.json(await client.getTeamHealth(teamHash(req.params.teamHash)!));
  });

  router.get('/signals', async (_req, res) => {
    res.json(await client.getSignals());
  });

  router.get('/slos', async (_req, res) => {
    res.json(await client.getSloReport());
  });

  router.get('/slos/budgets', async (req, res) => {
    res.json(await client.getErrorBudgets(period(req)));
  });

  router.get('/dora/summary', async (_req, res) => {
    res.json(await client.getDoraOverview());
  });

  router.get('/dora', async (req, res) => {
    const range = period(req);
    const team = teamHash(req.query.team);
    const [deployments, leadTimes, failures] = await Promise.all([
      client.getDeployments(range, team),
      client.getLeadTimes(range),
      client.getFailedDeployments(range),
    ]);
    const body: DoraData = {
      period: range,
      team: team ?? null,
      deployments,
      leadTimes,
      failures,
    };
    res.json(body);
  });

  router.get('/ai/adoption', async (req, res) => {
    res.json(await client.getAiAdoption(period(req)));
  });

  router.get('/ai/delivery', async (req, res) => {
    res.json(await client.getAiDelivery(period(req)));
  });

  router.get('/ai/quality', async (req, res) => {
    res.json(await client.getAiQuality(period(req)));
  });

  router.get('/ai/cost', async (req, res) => {
    const range = period(req);
    const [cost, returns] = await Promise.all([
      client.getAiCost(range),
      client.getAiReturn(range),
    ]);
    const body: AiCostAndReturn = { cost, return: returns };
    res.json(body);
  });

  router.get('/collaboration', async (req, res) => {
    res.json(
      await client.getCollaboration(
        oneOf(
          'windowDays',
          req.query.windowDays,
          COLLABORATION_WINDOWS,
          DEFAULT_WINDOW_DAYS,
        ),
      ),
    );
  });

  router.get('/reviews', async (req, res) => {
    res.json(
      await client.getReviewSummary(period(req), teamHash(req.query.team)),
    );
  });

  router.get('/trends', async (req, res) => {
    const days = oneOf('days', req.query.days, TREND_DAYS, TREND_DAYS[0]);
    res.json(await client.getTrends(periodFor(days), nodePath(req.query.node)));
  });

  router.get('/sprints', async (_req, res) => {
    res.json(await client.getSprintReport());
  });

  router.get('/hours', async (_req, res) => {
    res.json(await client.getHoursInvestment());
  });

  router.get('/kudos', async (req, res) => {
    res.json(await client.getKudos(period(req), teamHash(req.query.team)));
  });

  return router;
}
