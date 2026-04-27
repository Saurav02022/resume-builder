import { readFile } from "node:fs/promises";
import path from "node:path";

const E2E_ROOT = path.resolve(__dirname, "..");

export async function loadFixtureText(relativePath: string): Promise<string> {
  const filePath = path.join(E2E_ROOT, relativePath);
  return readFile(filePath, "utf8");
}

export async function loadFixtureJson<T>(relativePath: string): Promise<T> {
  const raw = await loadFixtureText(relativePath);
  return JSON.parse(raw) as T;
}
