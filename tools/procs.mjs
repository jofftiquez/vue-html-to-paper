// Start/stop app servers (vite preview, nuxt preview, ...) for dogfooding.
import { spawn } from 'node:child_process';

export async function startServer (cmd, args, { cwd, url, env = {}, timeout = 90000 }) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url); if (r.ok) return { child, output: () => out }; } catch {}
    if (child.exitCode !== null) throw new Error(`server exited: ${out}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  stop({ child });
  throw new Error(`server did not start at ${url}: ${out.slice(-2000)}`);
}

export function stop ({ child }) {
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
}
