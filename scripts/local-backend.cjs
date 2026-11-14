const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const workdir = path.join(root, '.supabase-local');
const target = path.join(workdir, 'supabase');
const cutoff = '20260516160000';
const command = process.argv[2] || 'start';
function run(args, capture = false) {
  return execFileSync('supabase', ['--workdir', workdir, ...args], { cwd: root, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
}
fs.mkdirSync(path.join(target, 'migrations'), { recursive: true });
fs.mkdirSync(path.join(target, '.temp'), { recursive: true });
fs.copyFileSync(path.join(root, 'supabase/local/postgres-version'), path.join(target, '.temp/postgres-version'));
fs.copyFileSync(path.join(root, 'supabase/config.toml'), path.join(target, 'config.toml'));
fs.copyFileSync(path.join(root, 'supabase/local/schema.sql'), path.join(target, 'migrations', `${cutoff}_local_baseline.sql`));
for (const file of fs.readdirSync(path.join(root, 'supabase/migrations'))) {
  if (file.slice(0, 14) > cutoff) fs.copyFileSync(path.join(root, 'supabase/migrations', file), path.join(target, 'migrations', file));
}
if (command === 'stop') { run(['stop']); process.exit(0); }
if (command === 'status') { run(['status']); process.exit(0); }
if (command !== 'start') throw new Error('Use start, stop ou status.');
run(['start']);
run(['migration', 'up', '--local']);
const status = JSON.parse(run(['status', '-o', 'json'], true));
const publicKey = status.ANON_KEY;
if (!publicKey || !status.API_URL) throw new Error('Supabase local não retornou URL e chave pública.');
const envPath = path.join(root, '.env.local');
let existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
existing = existing.split('\n').filter(line => !/^EXPO_PUBLIC_(SUPABASE_URL|SUPABASE_ANON_KEY|BACKEND_TARGET)=/.test(line)).join('\n').trim();
fs.writeFileSync(envPath, `${existing}\nEXPO_PUBLIC_BACKEND_TARGET=local\nEXPO_PUBLIC_SUPABASE_URL=${status.API_URL}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${publicKey}\n`);
console.log('App configurado para o Supabase LOCAL. Reinicie o Expo com npm start -- --clear.');
