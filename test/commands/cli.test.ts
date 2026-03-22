import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

const fixtureRoot = path.resolve("test/fixtures/codex");

function createIo() {
  let stdout = "";
  let stderr = "";

  return {
    io: {
      stdout(message: string) {
        stdout += message;
      },
      stderr(message: string) {
        stderr += message;
      },
    },
    read() {
      return { stdout, stderr };
    },
  };
}

describe("runCli", () => {
  it("renders summary json for a fixture codex home", async () => {
    const { io, read } = createIo();
    const previousColumns = process.env.COLUMNS;
    process.env.COLUMNS = "200";
    const exitCode = await runCli(
      [
        "summary",
        "--json",
        "--codex-home",
        fixtureRoot,
        "--timezone",
        "UTC",
      ],
      io,
      {},
    );
    process.env.COLUMNS = previousColumns;

    const { stdout, stderr } = read();
    expect(exitCode).toBe(0);
    expect(stderr).toBe("");

    const parsed = JSON.parse(stdout) as {
      summary: { totalTokens: number; measurableSessionCount: number };
      models: Array<{ model: string }>;
    };

    expect(parsed.summary.totalTokens).toBe(2750);
    expect(parsed.summary.measurableSessionCount).toBe(2);
    expect(parsed.models[0]?.model).toBe("gpt-5-codex");
  });

  it("supports daily text output with date filtering", async () => {
    const { io, read } = createIo();
    const previousColumns = process.env.COLUMNS;
    process.env.COLUMNS = "200";
    const exitCode = await runCli(
      [
        "daily",
        "--codex-home",
        fixtureRoot,
        "--timezone",
        "UTC",
        "--since",
        "2026-03-21",
      ],
      io,
      {},
    );
    process.env.COLUMNS = previousColumns;

    const { stdout } = read();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("┌");
    expect(stdout).toContain("2026-03-21");
    expect(stdout).toContain("Total");
    expect(stdout).not.toContain("2026-03-20");
  });
});
