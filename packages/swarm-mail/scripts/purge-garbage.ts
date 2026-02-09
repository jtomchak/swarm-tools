#!/usr/bin/env npx tsx

import { createClient } from "@libsql/client";
import { resolve } from "path";
import { homedir } from "os";

const dbPath = resolve(homedir(), ".config/swarm-tools/swarm.db");
console.log("Database path:", dbPath);

const client = createClient({
  url: `file:${dbPath}`,
  flags: 6, // SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE
});

const SYSTEM_PATTERNS = [
  /^System:\s*\[/,
  /^OUTCOME:/i,
  /^DECISION:/i,
  /^COMPACTION:/i,
  /health.?watchdog/i,
  /^Exec completed/i,
  /heartbeat/i,
  /^Run ~?\/?.*health-watchdog/i,
  /^\[.*\]\s*(Starting|Checking|Running)/,
  /^Telegram\b/i,
  /^Session \w+ \(\d{4}-/,
  /^Session ended without summary/,
  /openclaw system event/i,
  /^\[swarm-plugin\]/,
  /^<hivemind-context>/,
  /Read HEARTBEAT\.md/i,
  /HEARTBEAT_OK/i,
  /^Worker Monitor/i,
  /Ralph loop monitor/i,
];

function isGarbage(content: string | null): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  if (trimmed.length < 80) return true;
  for (const p of SYSTEM_PATTERNS) {
    if (p.test(trimmed)) return true;
  }
  return false;
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (e.code === 'SQLITE_BUSY' && i < retries - 1) {
        console.log(`  DB busy, retrying in ${delayMs}ms... (${i + 1}/${retries})`);
        await sleep(delayMs);
        continue;
      }
      throw e;
    }
  }
  throw new Error('Unreachable');
}

async function purge() {
  // Set busy timeout
  await client.execute("PRAGMA busy_timeout = 10000");

  const total = await client.execute("SELECT COUNT(id) as count FROM memories");
  console.log(`\nTotal memories: ${total.rows[0].count}`);

  // Fetch all in batches
  const allRows = await client.execute("SELECT id, content FROM memories");
  console.log(`Fetched ${allRows.rows.length} memories`);

  const garbageIds: string[] = [];
  for (const row of allRows.rows) {
    if (isGarbage(row.content as string | null)) {
      garbageIds.push(row.id as string);
    }
  }

  console.log(`Garbage identified: ${garbageIds.length}`);
  console.log(`Will keep: ${allRows.rows.length - garbageIds.length}`);

  if (garbageIds.length === 0) {
    console.log("Nothing to purge!");
    return;
  }

  // Delete in batches of 200
  const batchSize = 200;
  let totalDeleted = 0;

  for (let i = 0; i < garbageIds.length; i += batchSize) {
    const batch = garbageIds.slice(i, i + batchSize);
    const placeholders = batch.map(() => "?").join(",");

    // Delete from main table (triggers handle FTS + vector index)
    await withRetry(() => client.execute({
      sql: `DELETE FROM memories WHERE id IN (${placeholders})`,
      args: batch,
    }));

    // Delete from memory_links (both directions)
    await withRetry(() => client.execute({
      sql: `DELETE FROM memory_links WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})`,
      args: [...batch, ...batch],
    }));

    // Delete from memory_entities
    await withRetry(() => client.execute({
      sql: `DELETE FROM memory_entities WHERE memory_id IN (${placeholders})`,
      args: batch,
    }));

    totalDeleted += batch.length;
    console.log(`  Deleted ${totalDeleted}/${garbageIds.length}`);
  }

  // Verify
  const remaining = await client.execute("SELECT COUNT(id) as count FROM memories");
  console.log(`\nRemaining memories: ${remaining.rows[0].count}`);
  console.log("Done!");
}

purge().catch(console.error);
