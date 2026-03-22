# Codexstats Plan

## Architecture Verdict

Yes, the overall direction is correct:

- standalone local-first CLI
- parse Codex rollout JSONL files
- recover token deltas from cumulative usage
- estimate API-equivalent cost
- keep the core reusable for a later desktop app

The main correction is this:

- do **not** make `turn` the primary accounting unit in v1

Based on the current Codex and `@ccusage/codex` behavior, the reliable atomic unit is a **normalized token usage event delta**, not a guaranteed per-turn record. A turn-level view can be added later only when the local log format proves stable enough for it.

## Goal

Build `codexstats` as a standalone CLI that estimates OpenAI Codex usage value from local session logs.

The product goal is:

- read local Codex session data from the user machine
- reconstruct token usage from Codex rollout events
- aggregate usage by day, month, session, model, and source
- estimate API-equivalent cost
- support both `api` and `oauth-estimate` reporting labels
- keep the parsing and pricing core reusable for a future desktop or menubar app

## Product Scope

### In scope

- Codex local session discovery
- rollout JSONL parsing
- event normalization
- token delta recovery from cumulative usage
- day, month, and session aggregation
- model-based pricing estimation
- CLI reporting
- stable JSON output for scripting and future UI reuse

### Out of scope for v1

- exact official ChatGPT or Codex OAuth billing reconciliation
- remote account scraping
- browser automation against usage pages
- live statusline hooks
- watch mode
- database-backed indexing
- guaranteed turn-level accounting

## Product Definition

`codexstats` should answer:

- how many tokens did I use today
- how much did each Codex session consume
- which model used the most tokens this week or month
- what is my estimated API-equivalent cost
- what is the approximate value of my Codex OAuth usage under API pricing

## Key Reality Checks

These are the main implementation realities your architecture should reflect.

### 1. The primary unit is an event delta, not a turn

`@ccusage/codex` currently reconstructs usage from `token_count` events in local Codex session logs and aggregates those recovered deltas by day, month, session, and model.

That means v1 should center on:

- raw log entry
- normalized usage event
- aggregated report row

Not on:

- guaranteed turn ids
- turn-perfect cost attribution

### 2. Token usage is cumulative and requires recovery logic

Codex logs expose cumulative usage snapshots. The parser must recover billable deltas by comparing snapshots over time.

The normalizer should:

- prefer a direct per-event usage payload when present
- otherwise diff cumulative totals against the previous snapshot
- clamp invalid negative movement to zero
- attach warnings when recovery is imperfect

### 3. Historical coverage has a real cutoff

According to the current `ccusage` Codex guide, Codex CLI started emitting `token_count` events on **September 6, 2025** in OpenAI Codex commit `0269096`.

Implication:

- sessions before September 6, 2025 may not have measurable token usage at all
- the tool must treat those sessions as unmeasurable, not zero-cost

### 4. Model metadata is not always present

Some historical Codex logs emitted token usage without the matching model metadata.

Implication:

- pricing may be impossible for some sessions
- fallback pricing should be explicit and labeled
- JSON output should expose whether a fallback model assumption was used

### 5. Reasoning tokens are informational, not separately billable

`reasoning_output_tokens` should be tracked for reporting, but not priced as a second output stream if they are already included in `output_tokens`.

## Pricing Position

### `api`

Use API-equivalent model pricing.

This is appropriate for:

- Codex API-key users
- comparing usage across sessions
- establishing a consistent internal cost estimate

### `oauth-estimate`

Use the same token accounting and the same API-equivalent pricing formula, but label the result as an estimate of subscription value, not official billing.

This mode must always be labeled as:

- estimated
- unofficial
- API-equivalent

## New Project Recommendation

Create a separate repository, for example:

- `codexstats`

Suggested stack:

- TypeScript
- Node.js
- ESM
- Vitest
- `tsx` for development

Reason:

- local JSONL parsing and recursive file traversal are straightforward in Node
- TypeScript keeps the event model and normalization rules explicit
- the same core can later be reused in Electron or Tauri

## Recommended v1 Architecture

### 1. Discovery layer

Responsible for finding Codex session files from disk.

Responsibilities:

- resolve `CODEX_HOME` with `~/.codex` as the default
- locate rollout files under the sessions tree
- preserve session-relative paths as stable identifiers
- filter candidate files by date range when possible

### 2. Raw parsing layer

Responsible for reading JSONL and decoding raw rollout entries.

Responsibilities:

- stream JSONL lines
- tolerate malformed lines
- classify record types such as `session_meta`, `turn_context`, and `event_msg`
- preserve original timestamps and paths for debugging

### 3. Normalization layer

Responsible for converting raw Codex entries into stable internal usage events.

Responsibilities:

- extract session metadata
- resolve the best available model for each usage event
- recover token deltas from cumulative usage snapshots
- synthesize missing totals where safe
- mark fallback assumptions and warnings

This is the architectural center of the project.

### 4. Pricing source layer

Responsible for obtaining model pricing.

Responsibilities:

- map observed model aliases to canonical pricing ids
- expose a `PricingSource` interface
- support a bundled offline pricing snapshot
- optionally refresh pricing from a remote source later
- flag unknown or stale models

Do not hardwire pricing to a single manifest implementation in the core architecture.

### 5. Aggregation layer

Responsible for building report views from normalized events.

Responsibilities:

- daily totals
- monthly totals
- session totals
- model totals
- source totals
- overall summary totals

### 6. Presentation layer

Responsible for CLI output now and UI consumption later.

Responsibilities:

- table output
- compact terminal output
- JSON output
- stable report contracts for future app reuse

## Proposed Project Structure

```text
codexstats/
  src/
    cli.ts
    config.ts
    types.ts
    commands/
      daily.ts
      monthly.ts
      session.ts
      summary.ts
      inspect-events.ts
    codex/
      home.ts
      discovery.ts
      raw-types.ts
      loader.ts
      metadata.ts
      model-resolution.ts
      usage-normalizer.ts
      warnings.ts
    pricing/
      source.ts
      bundled-snapshot.ts
      model-map.ts
      estimate.ts
    aggregate/
      daily.ts
      monthly.ts
      sessions.ts
      summary.ts
      models.ts
      sources.ts
    render/
      text.ts
      json.ts
      table.ts
    utils/
      dates.ts
      filesystem.ts
  test/
    fixtures/
      codex/
    codex/
    pricing/
    aggregate/
    commands/
```

## Core Data Model

### Session metadata record

- session id
- relative rollout path
- absolute rollout path
- source
- cwd
- originator if present
- created timestamp
- warnings

### Normalized usage event

- session id
- timestamp
- local date key
- local month key
- model
- canonical model
- source
- input tokens
- cached input tokens
- output tokens
- reasoning output tokens
- total tokens
- `isFallbackModel`
- warnings

### Priced usage event

- normalized usage event fields
- pricing mode
- pricing source version
- estimated cost

### Aggregated report rows

- daily row
- monthly row
- session row
- summary row
- per-model breakdown row

## Codex Parsing Design

### Discovery

Read from:

- `CODEX_HOME/sessions`

Default roots:

- Windows: `%USERPROFILE%\\.codex`
- macOS/Linux: `~/.codex`

Traverse recursively through:

- `YYYY/MM/DD/rollout-*.jsonl`

### Event handling

For each rollout:

1. read the JSONL stream line by line
2. capture `session_meta` if present
3. collect model context metadata when available
4. inspect `event_msg` entries for token usage payloads
5. normalize token usage into event deltas
6. emit normalized usage events plus session metadata

### Token recovery rules

The normalizer must explicitly support:

- direct per-event token usage payloads when available
- cumulative total snapshots that need diffing
- cached input token fields and field aliases
- missing `total_tokens`, synthesized from input plus output where safe
- negative or regressive totals, clamped with warnings

### Model resolution rules

Model resolution order should be:

1. model attached directly to the usage-related context
2. nearest relevant model context metadata
3. configured fallback model, marked as fallback
4. skip pricing if no safe resolution is possible

### Timestamp rules

Use the timestamp on each rollout line as the source of truth.

Do not rely only on folder date or file name date for reporting.

### Timezone rules

Grouping must be timezone-aware.

The tool should:

- default to the user's local timezone
- allow `--timezone`
- use timezone-aware date bucketing for day and month reports

## Pricing Design

### PricingSource abstraction

Define a small interface such as:

- `getPricing(model: string): Promise<ModelPricing | null>`
- `getVersion(): string`

Initial implementations:

- bundled offline snapshot
- optional remote refresh later

### Cost formula

Use API-equivalent pricing with:

- non-cached input price
- cached input price
- output price

Reasoning tokens:

- reported
- not charged separately

### Output policy

For OAuth estimates:

- always label as estimated
- never present as official billed amount
- expose warnings when model fallback pricing was used

## CLI Design

### Initial commands

Suggested commands:

- `codexstats` -> same as `daily`
- `codexstats daily`
- `codexstats monthly`
- `codexstats session`
- `codexstats summary`
- `codexstats inspect-events`

`inspect-events` is worth adding early because this project lives or dies on parser trust.

### Suggested flags

- `--since <YYYYMMDD|YYYY-MM-DD>`
- `--until <YYYYMMDD|YYYY-MM-DD>`
- `--pricing api|oauth-estimate`
- `--json`
- `--timezone <IANA tz>`
- `--locale <locale>`
- `--session <id>`
- `--model <name>`
- `--source <source>`
- `--codex-home <path>`
- `--offline`
- `--compact`

### Example usage

```bash
codexstats
codexstats daily --pricing oauth-estimate
codexstats monthly
codexstats session --session <id>
codexstats summary --since 20260301 --until 20260331
codexstats inspect-events --session <id> --json
```

## Delivery Phases

### Phase 1: bootstrap

Goal:

- create the new repo and basic toolchain

Tasks:

- initialize package
- configure TypeScript
- configure Vitest
- define core types
- define report output contracts

Deliverable:

- empty CLI shell with passing test setup

### Phase 2: discovery and raw parsing

Goal:

- discover local Codex rollouts and load JSONL safely

Tasks:

- implement `CODEX_HOME` resolution
- implement rollout discovery
- implement streaming JSONL loader
- add malformed-line handling
- add fixture-based tests

Deliverable:

- CLI can list discovered sessions and basic metadata

### Phase 3: normalization and delta recovery

Goal:

- recover token usage correctly and defensively

Tasks:

- parse usage-related event payloads
- parse model metadata
- recover token deltas
- add fallback model handling
- add warnings and debug output

Deliverable:

- CLI can output trusted normalized usage events

### Phase 4: reporting

Goal:

- ship the core user-facing reports before polishing pricing

Tasks:

- add daily report
- add monthly report
- add session report
- add summary report
- add JSON output

Deliverable:

- practical CLI for token tracking

### Phase 5: pricing

Goal:

- attach API-equivalent cost estimates

Tasks:

- add `PricingSource`
- ship bundled pricing snapshot
- add model alias mapping
- add `api` and `oauth-estimate` labels
- surface warnings for unknown models

Deliverable:

- CLI outputs token and cost estimates

### Phase 6: hardening

Goal:

- make parsing resilient to real-world Codex history

Tasks:

- test sessions before and after September 6, 2025 behavior changes
- test sessions without model metadata
- test sessions with cached input
- test sessions with reasoning output
- test unknown models
- test timezone bucketing

Deliverable:

- stable v1 CLI

## Testing Strategy

### Unit tests

- path resolution
- directory traversal
- JSONL parsing
- event normalization
- delta derivation
- model resolution
- pricing calculation
- timezone bucketing

### Fixture tests

Use anonymized real Codex rollout fixtures for:

- single-session happy path
- cumulative total diffing
- direct usage payload extraction
- sessions with cached input token aliases
- sessions with reasoning output
- sessions with missing `total_tokens`
- sessions with missing model metadata
- sessions from older Codex versions
- sessions from different `source` values
- malformed JSONL lines

### Snapshot or output tests

- daily text output
- monthly text output
- session text output
- summary text output
- JSON output shape
- compact output

## Risks

### 1. Codex log format drift

Codex may change rollout event shapes over time.

Mitigation:

- defensive parsing
- version-tolerant normalization
- real fixture coverage across versions
- `inspect-events` command for fast debugging

### 2. Historical gap before September 6, 2025

Older logs may not contain token usage events at all.

Mitigation:

- mark them unmeasurable
- do not silently treat them as zero
- document the cutoff clearly

### 3. Missing model metadata

Some sessions may contain token usage but not enough model context for precise pricing.

Mitigation:

- explicit fallback model policy
- `isFallbackModel` in JSON output
- visible warnings in text output

### 4. Pricing source drift

Model pricing can change over time.

Mitigation:

- isolate pricing behind `PricingSource`
- ship a bundled snapshot
- later support refresh and version reporting

### 5. OAuth billing mismatch

OAuth cost is only an estimate of API-equivalent value.

Mitigation:

- label estimates clearly
- keep naming explicit
- avoid claiming billing parity

## v1 Success Criteria

`codexstats` is successful when it can:

- scan local Codex sessions
- identify which sessions are measurable vs unmeasurable
- compute daily token totals
- compute monthly token totals
- compute session-level totals
- price usage in `api` mode
- label the same estimate appropriately in `oauth-estimate` mode
- render stable text and JSON reports

## Future Work

### Turn-level reporting

Only add this if future Codex logs expose stable enough turn identifiers and usage attribution.

Until then, keep the internal accounting event-based.

### Desktop app or menubar app

Once the CLI core is stable, build a lightweight desktop app on top of the same core package.

The future app should:

- show today's estimated cost
- show today's token usage
- show top model used today
- show a 7-day trend
- show recent sessions
- refresh from local Codex session files automatically

Recommended architecture:

1. keep parsing, normalization, pricing, and aggregation in a shared TypeScript core package
2. keep the CLI as one consumer of that core
3. add Electron or Tauri later as a second consumer
4. avoid putting parsing logic directly in the UI layer

### Longer-term enhancements

- watch mode
- threshold notifications
- export reports
- local cache database for faster startup
- charting UI
- weekly reports
- pricing refresh command

## Recommended First Execution Order

1. Create the new `codexstats` repository.
2. Scaffold TypeScript, tests, and the CLI entrypoint.
3. Implement `CODEX_HOME` resolution, discovery, and JSONL loading.
4. Implement usage normalization and delta recovery.
5. Add `inspect-events` so parser behavior is visible during development.
6. Add daily, monthly, session, and summary outputs.
7. Add pricing sources and estimation labels.
8. Add documentation, fixtures, and sample outputs.
9. Only after the CLI stabilizes, start the desktop or menubar app spike.

## Reference Notes

Research that informed this plan:

- `ccusage` guide: [https://ccusage.com/guide/](https://ccusage.com/guide/)
- Codex beta guide: [https://ccusage.com/guide/codex](https://ccusage.com/guide/codex)
- `ryoppippi/ccusage` repository: [https://github.com/ryoppippi/ccusage](https://github.com/ryoppippi/ccusage)
- OpenAI Codex commit that added `token_count` support referenced by the guide:
  [https://github.com/openai/codex/commit/0269096229e8c8bd95185173706807dc10838c7a](https://github.com/openai/codex/commit/0269096229e8c8bd95185173706807dc10838c7a)
