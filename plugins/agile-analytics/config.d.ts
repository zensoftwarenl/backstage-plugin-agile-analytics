export interface Config {
  /** Configuration for the Agile Analytics plugin */
  agileAnalytics?: {
    /**
     * Base URL of the Agile Analytics web app, used for the links from
     * Backstage into Agile Analytics.
     * Defaults to https://www.prod.agileanalytics.cloud
     * @visibility frontend
     */
    appUrl?: string;
  };
}
