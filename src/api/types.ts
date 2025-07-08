import { DiscoveryApi } from '@backstage/core-plugin-api';

export type ApiConstructorOptions = {
  discoveryApi: DiscoveryApi;
  proxyPath?: string;
};

export type OrganisationDataOptions = {
  apiKey: string;
  orgHash: string;
};

export type OrganisationDataResponse = {
  orgHash: string;
  orgName: string;
  usersNumber: number;
  status: string;
  subscription: string;
};

export type Ticket = {
  summary: string;
  key: string;
  hours: number;
  timestamp: number;
  parent: {
    key: string;
    label: string;
    predictions: { value: number }[];
  };
  subtasks?: Ticket[];
  transition_from: string;
  transition_to: string;
  sprint: string;
  type: string;
  confidence: number;
};

export type RowFormattedTicket = {
  summary: string;
  'ticket key': string;
  hours: number;
  'date event': number;
  subtasks?: RowFormattedTicket[] | null;
  'transition from': string;
  'transition to': string;
  sprint: string;
  type: string;
  confidence: number;
  label: string;
};

export type SiDataOptions = {
  apiKey: string;
  orgHash: string;
  dateStart: number;
  dateEnd: number;
};

export type SiDataResponse = {
  featuresAmount: number;
  notFeaturesAmount: number;
  featuresTime: number;
  notFeaturesTime: number;
  tickets: Ticket[];
};

export type Deployment = {
  environment: string;
  provider: string;
  repository: string;
  status: string;
  user: string;
  timestamp: number;
};

export type DeploymentFreqResponse = Deployment[];

export type LeadTimeEvent = {
  key: string;
  provider: string;
  repository: string;
  lead_time_for_changes: number;
  lead_time: number;
  cycle_time: number;
  timestamp: number;
};

export type LeadTimeResponse = LeadTimeEvent[];

export type RiskChartResponse = {
  low: number;
  medium: number;
  high: number;
};

export type LeaksStatisticsItem = {
  date: string;
  leaks_fixed: number;
  leaks_quantity: number;
};

export type LeaksResponse = {
  statistics: LeaksStatisticsItem[];
};

export type Timeperiod = {
  value: string;
  label: string;
  date_start: number;
  date_end: number;
};

export type ReposDataOptions = {
  apiKey: string;
  orgHash: string;
};

export type Repo = {
  provider: string;
  provider_id: string;
  repositories: { name: string; url: string; webhook: boolean }[];
  groups?: {
    id: number;
    name: string
  }[]
};

export type ReposDataResponse = Repo[];

export type FilterRepo = {
  name: string;
  url: string;
  webhook: boolean;
  group: string;
  isSelected: boolean;
};

export type Option = { value: string; label: string };

export type DoraChart = {
  title: Option;
  name: string;
  type: string;
  data: any[];
};

export type DoraSeries = {
  name: string;
  type: string;
  data: any[];
  stickyTracking: boolean;
};

export type RiskChartData = {
  repo_name: string;
  repo_url: string;
  table_rows: number;
};

// TODO: NEW ADDITIONS - ADD TO THE PUBLIC PLUGIN

export type ServicesDataOptions = {
  apiKey: string;
  orgHash: string;
};

export type Service = {
  service: string;
  description?: string;
  url: string;
};

export type ServicesDataResponse = Service[];

export type SingleServiceDataOptions = {
  apiKey: string;
  orgHash: string;
  serviceName: string;
};

export type ServiceFeature = {
  backend: string;
  feature_name: string;
  slo_name: string;
  goal: number;
  method: string
};

export type SingleServiceDataResponse = {
  service: string;
  description?: string;
  url: string;
  features: ServiceFeature[];
};


export type ErrorBudgetChartDataOptions = {
  apiKey: string;
  orgHash: string;
  serviceName: string;
  date_start: number;
  date_end: number;
  step_size: string;
  feature: string
};


export type ErrorBudgetChartDataResponse = {
  data: [number, number][];
  feature: string;
  slo_name: string;
  slo_description: string;
  slo_target: number;
  reason?: string;
  status?: any;
  value?: {
    status?: any;
    reason?: string;
  };
};

export type SloHistoryDataOptions = {
  apiKey: string;
  orgHash: string;
  serviceName: string;
  date_start: number;
  date_end: number;
  step_size: string;
  feature: string;
};

export type SloHistoryDataResponse = {
  data?: {
    slo: string[];
    dates: [number, number][];
  };
};

export type ErrorBudgetsChartDataSeries = {
  slo_name: string;
  title: string;
  name: string;
};

export type Sprint = {
  duration: number;
  modified_date: number;
  start_date: number
};

export type Team = {
  team_hash: string;
  team_name: string;
  sprint?: Sprint;
  team_repositories?: Repo[];
  team_services?: Service[];
  users_in_team: string[];
};

export type TeamsDataResponse = Team[];

export type Workspace = {
  modification_date: string;
  users: string[];
  channels: string[];
  workspace_name: string;
};


export type WorkspacesDataResponse = Workspace[];

export type User = {
  hash: string;
  user_name: string;
  photo?: string;
  email?: string;
  rank?: number;
};

export type OrgUsersDataResponse = User[];


export type UserPicOptions = {
  url: string;
  apiKey: string;
  orgHash: string;
};

export type EmojiDataResponse = string[];

export type TeamKudosLeaderBoardOptions = {
  team: string;
  apiKey: string;
  orgHash: string;
  date_start: number;
  date_end: number;
};


export type TeamKudosLeaderBoardResponse = {
  total_kudos: number;
  team_members_list: {
    emoji_quantity: number;
    hash: string;
    rank: number
  };
  last_kudo: {
    amount: number;
    channel: string;
    from: string;
    message: string;
    to: string
  }
};

export type KudosChartResponse = (string | number)[][];





