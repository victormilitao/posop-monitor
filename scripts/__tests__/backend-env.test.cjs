const { test } = require('@jest/globals');
const assert = require('node:assert/strict');
const { validateBackendEnv } = require('../validate-backend-env.cjs');
const env = (target, url) => ({ EXPO_PUBLIC_BACKEND_TARGET: target, EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key' });
test('local aceita simuladores e rede privada', () => {
  for (const host of ['127.0.0.1', '10.0.2.2', '192.168.1.20']) assert.doesNotThrow(() => validateBackendEnv(env('local', `http://${host}:54321`)));
});
test('local bloqueia remoto inclusive sem seletor de ambiente', () => {
  for (const target of ['local', undefined]) assert.throws(() => validateBackendEnv(env(target, 'https://example.supabase.co')), /local não pode/);
});
test('distribuição bloqueia localhost e HTTP', () => {
  for (const url of ['http://127.0.0.1:54321', 'https://localhost', 'http://example.supabase.co']) assert.throws(() => validateBackendEnv(env('remote', url)), /Distribuição exige/);
  assert.doesNotThrow(() => validateBackendEnv(env('remote', 'https://example.supabase.co')));
});
test('configuração incompleta falha sem fallback remoto', () => assert.throws(() => validateBackendEnv({}), /Configure o backend/));

test('nome de domínio com prefixo privado não conta como rede local', () => assert.throws(() => validateBackendEnv(env('local', 'https://10.example.com')), /local não pode/));
