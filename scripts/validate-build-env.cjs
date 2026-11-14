const { validateBackendEnv } = require('./validate-backend-env.cjs');
validateBackendEnv({ ...process.env, EXPO_PUBLIC_BACKEND_TARGET: 'remote' });
const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
for (const name of required) {
  if (!process.env[name]?.trim()) throw new Error(`Configure ${name} no ambiente production do EAS.`);
}
const url = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL);
if (url.protocol !== 'https:') throw new Error('Supabase deve usar HTTPS no build de distribuição.');
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (key.startsWith('sb_secret_')) throw new Error('Use apenas a chave pública do Supabase.');
if (key.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('A chave JWT do cliente deve ter role anon.');
}
console.log('Variáveis públicas do build validadas (valores omitidos).');
