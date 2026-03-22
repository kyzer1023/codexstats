# codexstats

`codexstats` is a local-first CLI for estimating Codex usage and API-equivalent cost from Codex session logs.

It reads local rollout files under `CODEX_HOME/sessions` or the default `~/.codex/sessions`, recovers token deltas from `token_count` events, and renders terminal reports in table form with a total row.

## Features

- discover local Codex rollout files
- parse `session_meta`, `turn_context`, and `token_count`
- recover deltas from cumulative usage snapshots
- estimate API-equivalent cost with bundled pricing
- label `oauth-estimate` separately from `api`
- render `daily`, `monthly`, `session`, `summary`, and `inspect-events`

## Install

```bash
npm install
npm run build
```

For local development:

```bash
npm run dev -- summary
```

## Commands

```bash
codexstats
codexstats daily
codexstats monthly
codexstats session
codexstats summary
codexstats inspect-events
```

## Options

```bash
--codex-home <path>
--since <YYYYMMDD|YYYY-MM-DD>
--until <YYYYMMDD|YYYY-MM-DD>
--session <id>
--model <name>
--source <name>
--pricing <api|oauth-estimate>
--timezone <IANA tz>
--locale <locale>
--json
--compact
--offline
```

## Example

```bash
codexstats summary --timezone UTC
```

Example text output:

```text
+---------------------+----------------+
| Metric              |          Value |
+---------------------+----------------+
| Sessions            |              3 |
| Measurable sessions |              2 |
| Events              |              4 |
| Input               |          2,500 |
| Cached input        |            380 |
| Output              |            250 |
| Reasoning output    |             85 |
| Total tokens        |          2,750 |
| Estimated cost      |      $0.005197 |
| Warnings            | fallback-model |
+---------------------+----------------+
```

## Development

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

## Notes

- sessions without token usage are marked unmeasurable rather than silently treated as zero
- `oauth-estimate` is an API-equivalent estimate, not official billing
- pricing is currently a bundled snapshot, not a live pricing fetch
