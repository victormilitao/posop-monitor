function validateBackendEnv(env) {
  const target = env.EXPO_PUBLIC_BACKEND_TARGET || 'local';
  const url = new URL(env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321');
  const host = url.hostname;
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) && host.split('.').every(part => Number(part) <= 255);
  const local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '10.0.2.2' || (ipv4 && (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)));
  if (!['local', 'remote'].includes(target)) throw new Error('EXPO_PUBLIC_BACKEND_TARGET deve ser local ou remote.');
  if (target === 'local' && !local) throw new Error('Desenvolvimento local não pode usar Supabase remoto. Execute npm run db:start.');
  if (target === 'remote' && (local || url.protocol !== 'https:')) throw new Error('Distribuição exige Supabase remoto via HTTPS. Confira o ambiente production do EAS.');
  if (!env.EXPO_PUBLIC_SUPABASE_URL || !env.EXPO_PUBLIC_SUPABASE_ANON_KEY) throw new Error('Configure o backend: npm run db:start para desenvolvimento; variáveis do EAS para distribuição.');
}
module.exports = { validateBackendEnv };
