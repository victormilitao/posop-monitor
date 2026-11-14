/* global __dirname */
const { validateBackendEnv } = require('./scripts/validate-backend-env.cjs');

module.exports = ({ config }) => {
  require('@expo/env').load(__dirname, { silent: true });
  // EAS may read metadata before loading its server-side environment.
  if (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    validateBackendEnv(process.env);
  }
  return config;
};
