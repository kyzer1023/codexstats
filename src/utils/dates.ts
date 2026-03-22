const DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();
const MONTH_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function getFormatter(
  cache: Map<string, Intl.DateTimeFormat>,
  key: string,
  timezone: string,
  month: boolean,
): Intl.DateTimeFormat {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    ...(month ? {} : { day: "2-digit" }),
  });
  cache.set(key, formatter);
  return formatter;
}

export function resolveDefaultTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function toLocalDateKey(timestamp: string, timezone: string): string {
  const formatter = getFormatter(
    DATE_FORMATTERS,
    `${timezone}:date`,
    timezone,
    false,
  );

  return formatter.format(new Date(timestamp));
}

export function toLocalMonthKey(timestamp: string, timezone: string): string {
  const formatter = getFormatter(
    MONTH_FORMATTERS,
    `${timezone}:month`,
    timezone,
    true,
  );

  return formatter.format(new Date(timestamp));
}

export function normalizeDateArg(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error(`Invalid date value: ${value}`);
}
