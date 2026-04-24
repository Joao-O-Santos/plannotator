---
title: "Troubleshooting"
description: "Common issues and how to resolve them."
sidebar:
  order: 24
section: "Guides"
---

## Lost a Plannotator tab?

If you accidentally close a Plannotator browser tab, the server is still running in the background. You can find and reopen it:

```bash
plannotator sessions
```

This lists all active sessions with their mode, project, URL, and how long they've been running:

```
Active Plannotator sessions:

  #1  review    my-project           http://localhost:54321    3m ago
  #2  plan      my-project           http://localhost:12345    15m ago

Reopen with: plannotator sessions --open [N]
```

To reopen one:

```bash
plannotator sessions --open       # reopens the most recent
plannotator sessions --open 2     # reopens session #2
```

Stale sessions from crashed processes are cleaned up automatically. You can also force cleanup with `plannotator sessions --clean`.

## Where does Plannotator store data?

All local data lives under `~/.plannotator/` by default. When `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, or `XDG_CACHE_HOME` are set, Plannotator respects those locations instead.

| Directory | Default | XDG override | What's in it |
|-----------|---------|--------------|-------------|
| **Config** | `~/.plannotator/` | `$XDG_CONFIG_HOME/plannotator/` | `config.json` — user settings. |
| **Data** | `~/.plannotator/` | `$XDG_DATA_HOME/plannotator/` | `plans/`, `history/`, `hooks/` |
| **Cache** | `~/.plannotator/` | `$XDG_CACHE_HOME/plannotator/` | `drafts/`, `sessions/`, `pastes/` |

You can also override any path via `PLANNOTATOR_CONFIG_DIR`, `PLANNOTATOR_DATA_DIR`, or `PLANNOTATOR_CACHE_DIR`.

Legacy data in `~/.plannotator/` is still readable for backward compatibility but new data is written to the resolved path.

Plan saving is enabled by default. You can change the save directory or disable it entirely in the Plannotator UI settings (gear icon).

## Browser doesn't open

If the UI doesn't open automatically, check:

- **Remote/SSH session?** Set `PLANNOTATOR_REMOTE=1` and `PLANNOTATOR_PORT` to a port you'll forward. See the [remote guide](/docs/guides/remote-and-devcontainers/).
- **Wrong browser?** Set `PLANNOTATOR_BROWSER` to the app name or path, or use `--browser` for a one-off override.
- **URL still works** — even if the browser didn't open, the server is running. Check `plannotator sessions` for the URL and open it manually.

## Hook doesn't fire

If `ExitPlanMode` doesn't trigger Plannotator:

1. Make sure the plugin is installed: `/plugin install plannotator@plannotator`
2. Restart Claude Code after installing (hooks load on startup)
3. Verify `plannotator` is on your PATH: `which plannotator`
4. Check that plan mode is enabled in your Claude Code session

## OpenCode build agent cannot call `submit_plan`

This is expected with the default OpenCode workflow. Plannotator now defaults to `plan-agent`, which keeps `submit_plan` available to OpenCode's `plan` agent and hides or denies it for `build` and other non-planning primary agents.

If you want the old broad behavior, opt in from `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    ["@plannotator/opencode@latest", {
      "workflow": "all-agents"
    }]
  ]
}
```

If you do not want automatic plan review at all, use `workflow: "manual"` and run `/plannotator-last` or `/plannotator-annotate` when you want Plannotator.
