import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function exists(path: string): boolean {
  return existsSync(path);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function readTextIfExists(path: string): string | undefined {
  return existsSync(path) ? readText(path) : undefined;
}

export function writeText(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf8");
}

export function copyFile(from: string, to: string): void {
  ensureDir(dirname(to));
  copyFileSync(from, to);
}

export function hashContent(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function hashFile(path: string): string {
  return hashContent(readFileSync(path));
}
