export interface Config {
  /** Configuration for the Agile Analytics plugin */
  agileAnalytics?: {
    /**
     * The hash of your organisation in Agile Analytics. Required unless
     * `demo` is true.
     */
    orgHash?: string;
    /**
     * An Agile Analytics API key. It reads all data of the organisation, so
     * it is only ever used by the backend. Required unless `demo` is true.
     * @visibility secret
     */
    apiKey?: string;
    /**
     * Base URL of the Agile Analytics API.
     * Defaults to https://api.prod.agileanalytics.cloud
     */
    baseUrl?: string;
    /**
     * How the API key is sent: `api-key` sends the base64 encoded key in an
     * `Api-Key` header, `bearer` sends `Authorization: Bearer <key>`.
     * `legacy` is accepted as another name for `api-key`.
     * Defaults to `api-key`.
     */
    authHeader?: 'api-key' | 'bearer' | 'legacy';
    /**
     * How long responses are cached, in minutes. Agile Analytics refreshes
     * its reports nightly. Defaults to 15.
     */
    cacheTtlMinutes?: number;
    /**
     * Serve made-up data instead of calling Agile Analytics, to try the
     * plugin without an account. Defaults to false.
     */
    demo?: boolean;
  };
}
