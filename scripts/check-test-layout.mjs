/* global console, process */

import { lstatSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testsRoot = resolve(workspaceRoot, "tests");
const allowedProjects = new Set(["domain", "store", "ui"]);
const testFiles = [];
const errors = [];
let realTestsRoot;

function isWithin(parent, target) {
  const relativePath = relative(parent, target);
  return relativePath === "" || (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

function walk(directory) {
  if (!isWithin(testsRoot, directory)) {
    errors.push(`Refusing to leave tests/: ${relative(workspaceRoot, directory)}`);
    return;
  }

  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
  } catch (error) {
    errors.push(`Cannot read ${relative(workspaceRoot, directory)}: ${error.message}`);
    return;
  }

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (!isWithin(testsRoot, entryPath)) {
      errors.push(`Refusing to inspect outside tests/: ${relative(workspaceRoot, entryPath)}`);
      continue;
    }
    if (entry.isSymbolicLink()) {
      errors.push(`Symbolic links are not allowed under tests/: ${relative(workspaceRoot, entryPath)}`);
      continue;
    }
    try {
      if (!isWithin(realTestsRoot, realpathSync(entryPath))) {
        errors.push(`Refusing to inspect outside tests/: ${relative(workspaceRoot, entryPath)}`);
        continue;
      }
    } catch (error) {
      errors.push(`Cannot resolve ${relative(workspaceRoot, entryPath)}: ${error.message}`);
      continue;
    }
    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".test.ts")) continue;

    const relativeTestPath = relative(testsRoot, entryPath);
    const project = relativeTestPath.split(sep)[0];
    testFiles.push(relativeTestPath);
    if (!allowedProjects.has(project)) {
      errors.push(`Test file is outside a known project: tests/${relativeTestPath}`);
    }
  }
}

try {
  const testsStats = lstatSync(testsRoot);
  if (testsStats.isSymbolicLink() || !testsStats.isDirectory()) {
    errors.push("tests/ must be a real directory, not a symbolic link.");
  } else {
    realTestsRoot = realpathSync(testsRoot);
    if (!isWithin(realpathSync(workspaceRoot), realTestsRoot)) {
      errors.push("Refusing to inspect tests/ outside the workspace.");
    } else {
      walk(testsRoot);
    }
  }
} catch (error) {
  errors.push(`Cannot inspect tests/: ${error.message}`);
}

if (testFiles.length === 0) {
  errors.push("No *.test.ts files found under tests/.");
}

if (errors.length > 0) {
  console.error("Test layout check failed:");
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const counts = [...allowedProjects]
    .map((project) => `${project}=${testFiles.filter((file) => file.startsWith(`${project}${sep}`)).length}`)
    .join(", ");
  console.log(`Test layout check passed: ${testFiles.length} files (${counts}).`);
}
