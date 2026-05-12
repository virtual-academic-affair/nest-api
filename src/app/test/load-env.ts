import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const defaultEnvPath = () => join(__dirname, '../../../.env');

/**
 * Merge key=value lines from a .env file into process.env (does not override existing keys).
 * Used by Jest setup and optional direct calls from tests.
 */
export function mergeEnvFromFile(envPath: string = defaultEnvPath()) {
  if (!existsSync(envPath)) {
    return;
  }
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

export function hasDbUrl(): boolean {
  return Boolean(process.env.DB_URL);
}
