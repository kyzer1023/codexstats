import { promises as fs } from "node:fs";
import { LoadedSessionFile, RawLogEntry } from "../types.js";

export async function loadSessionFile(
  absolutePath: string,
  sessionId: string,
): Promise<LoadedSessionFile> {
  const warnings: string[] = [];
  const rawContent = await fs.readFile(absolutePath, "utf8");
  const lines = rawContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const entries: RawLogEntry[] = [];

  for (const [index, line] of lines.entries()) {
    try {
      const parsed = JSON.parse(line) as RawLogEntry;
      entries.push(parsed);
    } catch {
      warnings.push(`malformed-json-line:${index + 1}`);
    }
  }

  return {
    sessionId,
    relativePath: sessionId,
    absolutePath,
    entries,
    warnings,
  };
}
