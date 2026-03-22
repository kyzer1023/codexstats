const EXACT_MODEL_MAP = new Map<string, string>([
  ["gpt-5", "gpt-5"],
  ["gpt-5-codex", "gpt-5-codex"],
  ["gpt-5.1-codex", "gpt-5.1-codex"],
  ["gpt-5.1-codex-mini", "gpt-5.1-codex-mini"],
  ["gpt-5.2-codex", "gpt-5.2-codex"],
  ["gpt-5.3-codex", "gpt-5.3-codex"],
  ["gpt-5-mini", "gpt-5-mini"],
  ["gpt-5 mini", "gpt-5-mini"],
  ["gpt-5.4", "gpt-5.4"],
  ["codex-mini-latest", "codex-mini-latest"],
]);

export function toCanonicalModel(model: string): string {
  const normalized = model.trim().toLowerCase();
  const exact = EXACT_MODEL_MAP.get(normalized);
  if (exact) {
    return exact;
  }

  for (const candidate of EXACT_MODEL_MAP.values()) {
    if (normalized.startsWith(`${candidate.toLowerCase()}-`)) {
      return candidate;
    }
  }

  return normalized;
}
