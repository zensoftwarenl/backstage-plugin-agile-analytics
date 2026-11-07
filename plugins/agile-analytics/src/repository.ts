import type {
  AiAdoption,
  Collaboration,
  DoraData,
} from '@zensoftwarenl/backstage-plugin-agile-analytics-common';
import { AiRepository, aiRepositories } from './ai';
import { DoraSummary, summariseDora } from './dora';
import { repositoryName } from './format';

/** Whether an Agile Analytics repository is the one at `path`, e.g. `group/project`. */
export function isRepository(
  repository: string | null | undefined,
  path: string,
) {
  return (
    !!repository &&
    repositoryName(repository).toLowerCase() ===
      repositoryName(path).toLowerCase()
  );
}

export type RepositoryInsights = {
  dora?: DoraSummary;
  knowledge?: Collaboration['repositories'][number];
  ai?: AiRepository;
};

/** What Agile Analytics knows about one repository. */
export function repositoryInsights(
  path: string,
  data: {
    dora?: DoraData;
    collaboration?: Collaboration | null;
    adoption?: AiAdoption | null;
  },
): RepositoryInsights {
  const ofRepository = <T extends { repository?: string | null }>(rows: T[]) =>
    rows.filter(row => isRepository(row.repository, path));

  const dora = data.dora
    ? summariseDora({
        ...data.dora,
        deployments: ofRepository(data.dora.deployments),
        leadTimes: ofRepository(data.dora.leadTimes),
        failures: ofRepository(data.dora.failures),
      })
    : undefined;
  const hasDora =
    !!dora &&
    (dora.productionDeployments > 0 ||
      dora.failedDeployments.length > 0 ||
      dora.leadTime !== null);

  return {
    dora: hasDora ? dora : undefined,
    knowledge: data.collaboration?.repositories.find(r =>
      isRepository(r.repository, path),
    ),
    ai: aiRepositories(ofRepository(data.adoption?.merge_requests ?? []))[0],
  };
}
