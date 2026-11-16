import { chmodSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const hooks = execSync('git rev-parse --git-path hooks', { encoding: 'utf8' }).trim();
  const source = join(dirname(fileURLToPath(import.meta.url)), 'pre-commit');
  const target = join(hooks, 'pre-commit');
  copyFileSync(source, target);
  chmodSync(target, 0o755);
} catch {
  process.exit(0);
}
