import path from "node:path";
import { pathExists, walkFiles } from "../utils/filesystem.js";

function normalizePathSegments(targetPath: string): string {
  return targetPath.split(path.sep).join("/");
}

export async function discoverRolloutFiles(codexHome: string): Promise<string[]> {
  const sessionsRoot = path.join(codexHome, "sessions");
  if (!(await pathExists(sessionsRoot))) {
    return [];
  }

  const allFiles = await walkFiles(sessionsRoot);
  return allFiles
    .filter((filePath) => /rollout-.*\.jsonl$/i.test(filePath))
    .sort((left, right) => normalizePathSegments(left).localeCompare(normalizePathSegments(right)));
}

export function sessionIdFromPath(codexHome: string, rolloutPath: string): string {
  const sessionsRoot = path.join(codexHome, "sessions");
  return normalizePathSegments(path.relative(sessionsRoot, rolloutPath));
}
