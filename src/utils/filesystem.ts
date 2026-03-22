import { promises as fs } from "node:fs";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function walkFiles(root: string): Promise<string[]> {
  const results: string[] = [];

  async function visit(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const nextPath = `${currentPath}/${entry.name}`;

      if (entry.isDirectory()) {
        await visit(nextPath);
        continue;
      }

      if (entry.isFile()) {
        results.push(nextPath);
      }
    }
  }

  await visit(root);
  return results;
}
