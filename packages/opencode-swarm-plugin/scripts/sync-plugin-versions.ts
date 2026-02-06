#!/usr/bin/env bun
/**
 * Sync package versions to all plugin manifests
 *
 * Updates three plugin manifests from their respective package.json sources:
 * - packages/opencode-swarm-plugin/claude-plugin/.claude-plugin/plugin.json
 *   (from packages/opencode-swarm-plugin/package.json)
 * - packages/claude-code-swarm-plugin/.claude-plugin/plugin.json
 *   (from packages/claude-code-swarm-plugin/package.json)
 * - .claude-plugin/marketplace.json
 *   (from packages/opencode-swarm-plugin/package.json)
 *
 * Triggered by changesets via the "version" script in either package.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

interface MarketplaceJson {
  name: string;
  owner: { name: string };
  metadata: { description: string };
  plugins: Array<{
    name: string;
    source: string;
    description: string;
    version: string;
    author: { name: string };
  }>;
}

interface PluginJson {
  name: string;
  description: string;
  version: string;
  [key: string]: unknown;
}

/**
 * Read and parse a JSON file
 */
function readJson<T>(path: string): T {
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Write JSON with proper formatting
 */
function writeJson(path: string, data: unknown): void {
  const content = JSON.stringify(data, null, 2) + "\n";
  writeFileSync(path, content, "utf-8");
}

/**
 * Find the monorepo root by walking up from cwd looking for .claude-plugin/marketplace.json
 */
function findRepoRoot(): string {
  let dir = process.cwd();
  while (dir !== "/") {
    if (existsSync(join(dir, ".claude-plugin", "marketplace.json"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  throw new Error("Could not find repo root (no .claude-plugin/marketplace.json found)");
}

/**
 * Sync a plugin.json version from its corresponding package.json
 */
function syncPluginJson(
  label: string,
  packageJsonPath: string,
  pluginJsonPath: string,
): { version: string; oldVersion: string; updated: boolean } {
  if (!existsSync(packageJsonPath)) {
    console.error(`   SKIP ${label}: package.json not found at ${packageJsonPath}`);
    return { version: "", oldVersion: "", updated: false };
  }
  if (!existsSync(pluginJsonPath)) {
    console.error(`   SKIP ${label}: plugin.json not found at ${pluginJsonPath}`);
    return { version: "", oldVersion: "", updated: false };
  }

  const pkg = readJson<PackageJson>(packageJsonPath);
  const plugin = readJson<PluginJson>(pluginJsonPath);

  const oldVersion = plugin.version;
  if (oldVersion === pkg.version) {
    console.log(`   ${label}: already at ${pkg.version}`);
    return { version: pkg.version, oldVersion, updated: false };
  }

  plugin.version = pkg.version;
  writeJson(pluginJsonPath, plugin);
  console.log(`   ${label}: ${oldVersion} -> ${pkg.version}`);
  return { version: pkg.version, oldVersion, updated: true };
}

function main() {
  console.log("Syncing plugin versions...\n");

  const root = findRepoRoot();
  console.log(`   Repo root: ${root}\n`);

  // 1. opencode-swarm-plugin plugin.json
  syncPluginJson(
    "opencode-swarm-plugin/plugin.json",
    join(root, "packages/opencode-swarm-plugin/package.json"),
    join(root, "packages/opencode-swarm-plugin/claude-plugin/.claude-plugin/plugin.json"),
  );

  // 2. claude-code-swarm-plugin plugin.json
  syncPluginJson(
    "claude-code-swarm-plugin/plugin.json",
    join(root, "packages/claude-code-swarm-plugin/package.json"),
    join(root, "packages/claude-code-swarm-plugin/.claude-plugin/plugin.json"),
  );

  // 3. Root marketplace.json (version tracks opencode-swarm-plugin)
  const marketplacePath = join(root, ".claude-plugin/marketplace.json");
  const opencodePkgPath = join(root, "packages/opencode-swarm-plugin/package.json");

  const opencodePkg = readJson<PackageJson>(opencodePkgPath);
  const marketplace = readJson<MarketplaceJson>(marketplacePath);

  const swarmPlugin = marketplace.plugins.find(p => p.name === "swarm");
  if (!swarmPlugin) {
    console.error("   ERROR: Could not find 'swarm' plugin in marketplace.json");
    process.exit(1);
  }

  const oldMarketplaceVersion = swarmPlugin.version;
  if (oldMarketplaceVersion === opencodePkg.version) {
    console.log(`   marketplace.json: already at ${opencodePkg.version}`);
  } else {
    swarmPlugin.version = opencodePkg.version;
    writeJson(marketplacePath, marketplace);
    console.log(`   marketplace.json: ${oldMarketplaceVersion} -> ${opencodePkg.version}`);
  }

  console.log("\nVersion sync complete");
}

main();
