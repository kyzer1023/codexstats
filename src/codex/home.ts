import path from "node:path";
import os from "node:os";

export function resolveCodexHome(
  explicitPath: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }

  const envHome = env.CODEX_HOME;
  if (envHome) {
    return path.resolve(envHome);
  }

  return path.join(os.homedir(), ".codex");
}
