import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
}

// Exercise both configuration states, without requiring accounts or network access.
// Restore the user's normal production build even if a browser test fails.
let failure;
try {
  const disconnected = { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' };
  run(npm, ['run', 'build'], disconnected);
  run(npm, ['exec', '--', 'playwright', 'test', 'tests/portfolio.spec.js', 'tests/shop.spec.js'], disconnected);
  const configured = { ...process.env, VITE_SUPABASE_URL: 'https://luma-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_browser_fixture' };
  run(npm, ['run', 'build'], configured);
  run(npm, ['exec', '--', 'playwright', 'test', 'tests/shop-auth.spec.js', 'tests/shop-checkout.spec.js'], configured);
} catch (error) {
  failure = error;
} finally {
  try { run(npm, ['run', 'build']); } catch (error) { failure ??= error; }
}
if (failure) { console.error(failure.message); process.exitCode = 1; }
