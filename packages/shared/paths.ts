/**
 * Plannotator Path Resolution
 *
 * Single source of truth for all directory paths.
 * Respects XDG Base Directory Specification and PLANNOTATOR_*_DIR overrides.
 *
 * Resolution priority (highest wins):
 *   1. PLANNOTATOR_*_DIR environment variable
 *   2. XDG_*_HOME environment variable
 *   3. Default (~/.plannotator — original behavior, backward compatible)
 *
 * When XDG_*_HOME is set, paths follow the spec:
 *   - Config → $XDG_CONFIG_HOME/plannotator/
 *   - Data   → $XDG_DATA_HOME/plannotator/
 *   - Cache  → $XDG_CACHE_HOME/plannotator/
 *
 * When nothing is set, everything stays in ~/.plannotator for backward
 * compatibility with existing installs.
 *
 * Migration strategy:
 *   - Reads: new resolved path first, fall back to legacy ~/.plannotator/
 *   - Writes: always write to the resolved path
 *   - Cache: no fallback (reconstructible)
 */

import { homedir } from "os";
import { join } from "path";
import { mkdirSync } from "fs";

export function getConfigDir(): string {
  const dir =
    process.env.PLANNOTATOR_CONFIG_DIR ||
    (process.env.XDG_CONFIG_HOME && join(process.env.XDG_CONFIG_HOME, "plannotator")) ||
    getLegacyDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDataDir(): string {
  const dir =
    process.env.PLANNOTATOR_DATA_DIR ||
    (process.env.XDG_DATA_HOME && join(process.env.XDG_DATA_HOME, "plannotator")) ||
    getLegacyDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getCacheDir(): string {
  const dir =
    process.env.PLANNOTATOR_CACHE_DIR ||
    (process.env.XDG_CACHE_HOME && join(process.env.XDG_CACHE_HOME, "plannotator")) ||
    getLegacyDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getLegacyDir(): string {
  return join(homedir(), ".plannotator");
}
