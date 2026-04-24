# XDG Base Directory Support — Design Decisions

## Problem

Plannotator stored all user data in `~/.plannotator/`. Users who follow the XDG Base Directory Specification wanted support for `~/.config/`, `~/.local/share/`, and `~/.cache/` instead.

## Solution

Add XDG-aware path resolution with **strict backward compatibility**.

### Resolution Priority (highest wins)

1. `PLANNOTATOR_*_DIR` environment variable (explicit override)
2. `XDG_*_HOME` environment variable (XDG spec)
3. `~/.plannotator` (original default — unchanged for existing users)

### Directory Mapping

| Category | Contents | Env Override | XDG Fallback | Default |
|----------|----------|--------------|--------------|---------|
| Config | `config.json` | `PLANNOTATOR_CONFIG_DIR` | `XDG_CONFIG_HOME` | `~/.plannotator` |
| Data | `plans/`, `history/`, `hooks/` | `PLANNOTATOR_DATA_DIR` | `XDG_DATA_HOME` | `~/.plannotator` |
| Cache | `drafts/`, `sessions/`, `pastes/`, logs, schemas | `PLANNOTATOR_CACHE_DIR` | `XDG_CACHE_HOME` | `~/.plannotator` |

### Migration Strategy

- **Reads**: Try resolved path first; if missing, fall back to `~/.plannotator/`
- **Writes**: Always write to the resolved path
- **Cache**: No fallback (reconstructible)
- **Indefinite**: Legacy fallback stays forever; no forced migration

This means:
- Existing users with `~/.plannotator/` see **zero change** unless they set XDG vars
- New users who set XDG vars get **proper spec compliance**
- Mixed-state users (some data in old path, some in new) see **merged views** where applicable (e.g., archive listing)

### Install Scripts

The bash, PowerShell, and CMD installers now resolve the config path dynamically:
1. Check `PLANNOTATOR_CONFIG_DIR`
2. Check `XDG_CONFIG_HOME`
3. Fall back to `~/.plannotator`

This ensures `verifyAttestation` config is read from the correct location regardless of the user's path setup.

### Tests

- `improvement-hooks.test.ts`: Validates both new-path reads and legacy-path fallback
- `test-sessions.sh`: Uses default `~/.plannotator/sessions` (no hardcoded XDG paths)

### Upstream PR Notes

- **No breaking changes**: Default behavior is identical to before
- **Opt-in only**: Users must set XDG env vars to activate new paths
- **No forced migration**: Old data is never moved or deleted
- **Windows**: Continues using `~/.plannotator` by default (cross-platform consistency)

## Personal Preference vs. Default

If you want data under `~/.config/plannotator/data/` instead of `~/.local/share/plannotator/`, set:

```bash
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.config"   # non-standard but valid
export XDG_CACHE_HOME="$HOME/.cache"
```

This is the author's personal preference but is **not** the default, to respect standard XDG conventions for other users.
