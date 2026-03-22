#!/usr/bin/env node

import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_FALLBACK_MODEL,
  DEFAULT_LOCALE,
  DEFAULT_PRICING_MODE,
  SUPPORTED_COMMANDS,
} from "./config.js";
import { runDailyCommand } from "./commands/daily.js";
import { runInspectEventsCommand } from "./commands/inspect-events.js";
import { runMonthlyCommand } from "./commands/monthly.js";
import { runSessionCommand } from "./commands/session.js";
import { runSummaryCommand } from "./commands/summary.js";
import { discoverRolloutFiles, sessionIdFromPath } from "./codex/discovery.js";
import { resolveCodexHome } from "./codex/home.js";
import { loadSessionFile } from "./codex/loader.js";
import { normalizeSession } from "./codex/usage-normalizer.js";
import { createBundledPricingSource } from "./pricing/bundled-snapshot.js";
import { priceEvents } from "./pricing/estimate.js";
import { renderJson } from "./render/json.js";
import { CliOptions, CommandContext, CommandOutput, PricingMode } from "./types.js";
import { normalizeDateArg, resolveDefaultTimezone } from "./utils/dates.js";

interface IoLike {
  stdout(message: string): void;
  stderr(message: string): void;
}

interface ParsedArgs {
  command: string;
  options: CliOptions;
  help: boolean;
}

function createDefaultIo(): IoLike {
  return {
    stdout(message: string) {
      process.stdout.write(message);
    },
    stderr(message: string) {
      process.stderr.write(message);
    },
  };
}

function renderHelp(): string {
  return `codexstats [command] [options]

Commands:
  daily
  monthly
  session
  summary
  inspect-events

Options:
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
  --help
`;
}

function defaultOptions(): CliOptions {
  return {
    codexHome: undefined,
    since: undefined,
    until: undefined,
    session: undefined,
    model: undefined,
    source: undefined,
    pricing: DEFAULT_PRICING_MODE as PricingMode,
    json: false,
    compact: false,
    offline: false,
    timezone: resolveDefaultTimezone(),
    locale: DEFAULT_LOCALE,
    fallbackModel: DEFAULT_FALLBACK_MODEL,
  };
}

function parseArgs(argv: string[]): ParsedArgs {
  const options = defaultOptions();
  let command = "daily";
  let help = false;
  let commandExplicitlySet = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current) {
      continue;
    }

    if (!current.startsWith("-") && SUPPORTED_COMMANDS.has(current) && !commandExplicitlySet) {
      command = current;
      commandExplicitlySet = true;
      continue;
    }

    if (current === "--help" || current === "-h") {
      help = true;
      continue;
    }

    if (current === "--json") {
      options.json = true;
      continue;
    }

    if (current === "--compact") {
      options.compact = true;
      continue;
    }

    if (current === "--offline") {
      options.offline = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue) {
      throw new Error(`Missing value for ${current}`);
    }

    switch (current) {
      case "--codex-home":
        options.codexHome = nextValue;
        break;
      case "--since":
        options.since = normalizeDateArg(nextValue);
        break;
      case "--until":
        options.until = normalizeDateArg(nextValue);
        break;
      case "--session":
        options.session = nextValue;
        break;
      case "--model":
        options.model = nextValue;
        break;
      case "--source":
        options.source = nextValue;
        break;
      case "--pricing":
        if (nextValue !== "api" && nextValue !== "oauth-estimate") {
          throw new Error(`Unsupported pricing mode: ${nextValue}`);
        }
        options.pricing = nextValue;
        break;
      case "--timezone":
        options.timezone = nextValue;
        break;
      case "--locale":
        options.locale = nextValue;
        break;
      default:
        throw new Error(`Unknown argument: ${current}`);
    }

    index += 1;
  }

  return { command, options, help };
}

function matchesEventFilters(
  event: { sessionId: string; localDateKey: string; model: string; source: string },
  options: CliOptions,
): boolean {
  if (options.session && event.sessionId !== options.session) {
    return false;
  }

  if (options.model && event.model !== options.model) {
    return false;
  }

  if (options.source && event.source !== options.source) {
    return false;
  }

  if (options.since && event.localDateKey < options.since) {
    return false;
  }

  if (options.until && event.localDateKey > options.until) {
    return false;
  }

  return true;
}

function matchesSessionFilters(
  sessionId: string,
  source: string,
  options: CliOptions,
): boolean {
  if (options.session && sessionId !== options.session) {
    return false;
  }

  if (options.source && source !== options.source) {
    return false;
  }

  return true;
}

async function buildContext(options: CliOptions, env: NodeJS.ProcessEnv): Promise<CommandContext> {
  const codexHome = resolveCodexHome(options.codexHome, env);
  const rolloutFiles = await discoverRolloutFiles(codexHome);
  const loadedFiles = await Promise.all(
    rolloutFiles.map((filePath) =>
      loadSessionFile(filePath, sessionIdFromPath(codexHome, filePath)),
    ),
  );

  const normalized = loadedFiles.map((file) =>
    normalizeSession(file, {
      timezone: options.timezone,
      fallbackModel: options.fallbackModel,
    }),
  );

  const sessions = normalized
    .map((entry) => entry.session)
    .filter((session) => matchesSessionFilters(session.sessionId, session.source, options));
  const events = normalized
    .flatMap((entry) => entry.events)
    .filter((event) => matchesEventFilters(event, options));
  const pricedEvents = priceEvents(
    events,
    options.pricing,
    createBundledPricingSource(),
  );

  return {
    options,
    sessions,
    events,
    pricedEvents,
  };
}

function selectCommand(command: string, context: CommandContext): CommandOutput {
  switch (command) {
    case "daily":
      return runDailyCommand(context);
    case "monthly":
      return runMonthlyCommand(context);
    case "session":
      return runSessionCommand(context);
    case "summary":
      return runSummaryCommand(context);
    case "inspect-events":
      return runInspectEventsCommand(context);
    default:
      throw new Error(`Unsupported command: ${command}`);
  }
}

export async function runCli(
  argv: string[],
  io: IoLike = createDefaultIo(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      io.stdout(renderHelp());
      return 0;
    }

    const context = await buildContext(parsed.options, env);
    const output = selectCommand(parsed.command, context);
    io.stdout(parsed.options.json ? renderJson(output.data) : output.text);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`${message}\n`);
    return 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
