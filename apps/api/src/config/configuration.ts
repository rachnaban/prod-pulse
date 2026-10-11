export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  aggIntervalSec: parseInt(process.env.AGG_INTERVAL_SEC ?? '60', 10),
  dcs: (process.env.DC_NAMES ?? 'dc-us-east,dc-us-west,dc-us-central,dc-eu-1,dc-eu-2,dc-apac-1,dc-apac-2,dc-latam-1')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL ?? '',
  splunk: {
    mode: process.env.SPLUNK_MODE ?? 'mock',
    url: process.env.SPLUNK_URL ?? '',
    token: process.env.SPLUNK_TOKEN ?? '',
    summaryIndex: process.env.SPLUNK_SUMMARY_INDEX ?? 'prod_summary',
  },
});
