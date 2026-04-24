/**
 * Plannotator Path Resolution
 *
 * Single source of truth for all directory paths.
 * Respects XDG Base Directory Specification and PLANNOTATOR_*_DIR overrides.
 *
 * Resolution priority (highest wins):
 *   1. PLANNOTATOR_*_DIR environment variable
 *   2. XDG_*_HOME environment variable
 *   3. Default (~/.config, ~/.cache)
 *
 * Migration strategy:
 *   - Reads: new path first, fall back to legacy ~/.plannotator/
 *   - Writes: always write to new path
 *   - Cache: no fallback (reconstructible)
 */

import { homedir } from "os";
import { join } from "path";
import { mkdirSync } from "fs";

export function getConfigDir(): string {
  const dir =
    process.env.PLANNOTATOR_CONFIG_DIR ||
    (process.env.XDG_CONFIG_HOME && join(process.env.XDG_CONFIG_HOME, "plannotator")) ||
    join(homedir(), ".config", "plannotator");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDataDir(): string {
  const dir =
    process.env.PLANNOTATOR_DATA_DIR || join(getConfigDir(), "data");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getCacheDir(): string {
  const dir =
    process.env.PLANNOTATOR_CACHE_DIR ||
    (process.env.XDG_CACHE_HOME && join(process.env.XDG_CACHE_HOME, "plannotator")) ||
    join(homedir(), ".cache", "plannotator");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getLegacyDir(): string {
  return join(homedir(), ".plannotator");
}
