/**
 * Plannotator Config
 *
 * Reads/writes ~/.config/plannotator/config.json for persistent user settings.
 * Runtime-agnostic: uses only node:fs, node:os, node:child_process.
 */

import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { getConfigDir, getLegacyDir } from "./paths";

export type DefaultDiffType = 'uncommitted' | 'unstaged' | 'staged';

export interface DiffOptions {
  diffStyle?: 'split' | 'unified';
  overflow?: 'scroll' | 'wrap';
  diffIndicators?: 'bars' | 'classic' | 'none';
  lineDiffType?: 'word-alt' | 'word' | 'char' | 'none';
  showLineNumbers?: boolean;
  showDiffBackground?: boolean;
  fontFamily?: string;
  fontSize?: string;
  defaultDiffType?: DefaultDiffType;
}

/** Single conventional comment label entry stored in config.json */
export interface CCLabelConfig {
  label: string;
  display: string;
  blocking: boolean;
}

export interface PlannotatorConfig {
  displayName?: string;
  diffOptions?: DiffOptions;
  conventionalComments?: boolean;
  /** null = explicitly cleared (use defaults), undefined = not set */
  conventionalLabels?: CCLabelConfig[] | null;
  /**
   * Enable `gh attestation verify` during CLI installation/upgrade.
   * Read by scripts/install.sh|ps1|cmd on every run (not by any runtime code).
   * When true, the installer runs build-provenance verification after the
   * SHA256 checksum check; requires `gh` CLI installed and authenticated
   * (`gh auth login`). OS-level opt-in only — no UI surface. Default: false.
   */
  verifyAttestation?: boolean;
  /**
   * Enable Jina Reader for URL-to-markdown conversion during annotation.
   * When true (default), `plannotator annotate <url>` routes through
   * r.jina.ai for better JS-rendered page support and reader-mode extraction.
   * Set to false to always use plain fetch + Turndown.
   */
  jina?: boolean;
}

function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

function getLegacyConfigPath(): string {
  return join(getLegacyDir(), "config.json");
}

/**
 * Load config from ~/.config/plannotator/config.json.
 * Falls back to legacy ~/.plannotator/config.json if the new path does not exist.
 * Returns {} on missing file or malformed JSON.
 */
export function loadConfig(): PlannotatorConfig {
  try {
    const newPath = getConfigPath();
    const legacyPath = getLegacyConfigPath();

    let raw: string | undefined;
    if (existsSync(newPath)) {
      raw = readFileSync(newPath, "utf-8");
    } else if (existsSync(legacyPath)) {
      raw = readFileSync(legacyPath, "utf-8");
    }

    if (raw === undefined) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (e) {
    process.stderr.write(`[plannotator] Warning: failed to read config.json: ${e}\n`);
    return {};
  }
}

/**
 * Save config by merging partial values into the existing file.
 * Creates ~/.config/plannotator/ directory if needed.
 */
export function saveConfig(partial: Partial<PlannotatorConfig>): void {
  try {
    const current = loadConfig();
    const mergedDiffOptions = (current.diffOptions || partial.diffOptions)
      ? { ...current.diffOptions, ...partial.diffOptions }
      : undefined;
    const merged = { ...current, ...partial, diffOptions: mergedDiffOptions };
    writeFileSync(getConfigPath(), JSON.stringify(merged, null, 2) + "\n", "utf-8");
  } catch (e) {
    process.stderr.write(`[plannotator] Warning: failed to write config.json: ${e}\n`);
  }
}

/**
 * Detect the git user name from `git config user.name`.
 * Returns null if git is unavailable, not in a repo, or user.name is not set.
 */
export function detectGitUser(): string | null {
  try {
    const name = execSync("git config user.name", { encoding: "utf-8", timeout: 3000 }).trim();
    return name || null;
  } catch {
    return null;
  }
}

/**
 * Build the serverConfig payload for API responses.
 * Reads config.json fresh each call so the response reflects the latest file on disk.
 */
export function getServerConfig(gitUser: string | null): {
  displayName?: string;
  diffOptions?: DiffOptions;
  gitUser?: string;
  conventionalComments?: boolean;
  conventionalLabels?: CCLabelConfig[] | null;
} {
  const cfg = loadConfig();
  return {
    displayName: cfg.displayName,
    diffOptions: cfg.diffOptions,
    gitUser: gitUser ?? undefined,
    ...(cfg.conventionalComments !== undefined && { conventionalComments: cfg.conventionalComments }),
    ...(cfg.conventionalLabels !== undefined && { conventionalLabels: cfg.conventionalLabels }),
  };
}

/**
 * Read the user's preferred default diff type from config, falling back to 'unstaged'.
 */
export function resolveDefaultDiffType(cfg?: PlannotatorConfig): DefaultDiffType {
  const v = cfg?.diffOptions?.defaultDiffType;
  return v === 'uncommitted' || v === 'unstaged' || v === 'staged' ? v : 'unstaged';
}

/**
 * Resolve whether to use Jina Reader for URL annotation.
 *
 * Priority (highest wins):
 *   --no-jina CLI flag  →  PLANNOTATOR_JINA env var  →  config.jina  →  default true
 */
export function resolveUseJina(cliNoJina: boolean, config: PlannotatorConfig): boolean {
  // CLI flag has highest priority
  if (cliNoJina) return false;

  // Environment variable
  const envVal = process.env.PLANNOTATOR_JINA;
  if (envVal !== undefined) {
    return envVal === "1" || envVal.toLowerCase() === "true";
  }

  // Config file
  if (config.jina !== undefined) return config.jina;

  // Default: enabled
  return true;
}
