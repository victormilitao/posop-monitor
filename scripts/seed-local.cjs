const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
async function main() {
  const workdir = path.resolve(__dirname, '../.supabase-local');
  const status = JSON.parse(execFileSync('supabase', ['--workdir', workdir, 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  if (!['localhost', '127.0.0.1'].includes(new URL(status.API_URL).hostname)) throw new Error('Seed permitido somente no banco local.');
  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({ email: 'medico@posop.local', password: 'PosopLocal123!', email_confirm: true, user_metadata: { full_name: 'Médico de Teste', role: 'doctor' } });
  if (error) {
    if (error.code === 'email_exists' || error.code === 'email_already_exists') { console.log('Conta de teste local já existe; dados preservados.'); return; }
    throw error;
  }
  const { error: profileError } = await admin.from('profiles').upsert({ id: data.user.id, full_name: 'Médico de Teste', role: 'doctor', email: 'medico@posop.local', cpf: '00000000000', crm: '12345/CE', phone: '85999990000' });
  if (profileError) throw profileError;
  console.log('Conta fictícia local criada. CPF: 00000000000; senha: PosopLocal123!');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
