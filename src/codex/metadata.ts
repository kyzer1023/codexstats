import { LoadedSessionFile, SessionMetadataRecord } from "../types.js";
import { getNestedRecord, isRecord } from "./raw-types.js";

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function extractSessionMetadata(file: LoadedSessionFile): SessionMetadataRecord {
  let source = "unknown";
  let cwd: string | undefined;
  let originator: string | undefined;
  let createdAt = file.entries[0]?.timestamp;

  for (const entry of file.entries) {
    if (entry.type !== "session_meta") {
      continue;
    }

    const payload = isRecord(entry.payload) ? entry.payload : {};
    source = getString(payload.source) ?? source;
    cwd = getString(payload.cwd) ?? cwd;
    originator =
      getString(payload.originator) ??
      getString(payload.origin) ??
      getString(getNestedRecord(payload, "meta")?.originator) ??
      originator;
    createdAt = entry.timestamp ?? createdAt;
    break;
  }

  return {
    sessionId: file.sessionId,
    relativePath: file.relativePath,
    absolutePath: file.absolutePath,
    source,
    cwd,
    originator,
    createdAt,
    warnings: [...file.warnings],
  };
}
