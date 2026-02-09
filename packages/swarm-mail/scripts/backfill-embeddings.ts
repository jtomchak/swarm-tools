#!/usr/bin/env bun

/**
 * Backfill Embeddings Script
 * 
 * Generates embeddings for memories that don't have them.
 * This handles imported/migrated data that was created before 
 * the embedding pipeline was in place.
 * 
 * Usage:
 *   bun run scripts/backfill-embeddings.ts [--dry-run] [--batch-size=100] [--limit=1000]
 */

import { createClient, type Client } from "@libsql/client";
import { resolve } from "path";
import { homedir } from "os";

// Configuration from environment or defaults
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mxbai-embed-large";
const EMBEDDING_DIM = 1024;

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const batchSizeArg = args.find(a => a.startsWith("--batch-size="));
const limitArg = args.find(a => a.startsWith("--limit="));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split("=")[1]) : 50;
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

const dbPath = resolve(homedir(), ".config/swarm-tools/swarm.db");

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: text.slice(0, 1000), // mxbai-embed-large has ~512 token context (~1000 chars safe)
      }),
    });

    if (!response.ok) {
      console.error(`❌ Ollama error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error(`❌ Embedding error:`, error);
    return null;
  }
}

async function backfill(client: Client) {
  console.log("🔍 Backfill Embeddings Script");
  console.log(`   Database: ${dbPath}`);
  console.log(`   Ollama: ${OLLAMA_HOST}`);
  console.log(`   Model: ${OLLAMA_MODEL}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Limit: ${LIMIT === Infinity ? "unlimited" : LIMIT}`);
  console.log(`   Dry run: ${dryRun}`);
  console.log();

  // Check Ollama health
  try {
    const health = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!health.ok) throw new Error("Ollama not responding");
    console.log("✅ Ollama is running");
  } catch (e) {
    console.error("❌ Ollama is not available at", OLLAMA_HOST);
    process.exit(1);
  }

  // Count memories needing embeddings
  const countResult = await client.execute(
    "SELECT COUNT(id) as count FROM memories WHERE embedding IS NULL"
  );
  const totalMissing = Number(countResult.rows[0].count);
  console.log(`📊 Memories without embeddings: ${totalMissing}`);
  
  if (totalMissing === 0) {
    console.log("✅ All memories have embeddings!");
    return;
  }

  const toProcess = Math.min(totalMissing, LIMIT);
  console.log(`🎯 Will process: ${toProcess} memories\n`);

  if (dryRun) {
    console.log("🔍 DRY RUN - no changes will be made\n");
    
    // Show sample of what would be processed
    const sample = await client.execute(`
      SELECT id, LENGTH(content) as len, created_at 
      FROM memories 
      WHERE embedding IS NULL 
      LIMIT 5
    `);
    
    console.log("Sample memories to process:");
    for (const row of sample.rows) {
      console.log(`  - ${row.id} (${row.len} chars, created: ${row.created_at})`);
    }
    return;
  }

  // Process in batches
  let processed = 0;
  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  while (processed < toProcess) {
    // Fetch batch
    const batch = await client.execute(`
      SELECT id, content 
      FROM memories 
      WHERE embedding IS NULL 
      LIMIT ${BATCH_SIZE}
    `);

    if (batch.rows.length === 0) break;

    console.log(`\n📦 Batch ${Math.floor(processed / BATCH_SIZE) + 1}: ${batch.rows.length} memories`);

    for (const row of batch.rows) {
      const id = row.id as string;
      const content = row.content as string;

      process.stdout.write(`  Processing ${id}...`);

      const embedding = await generateEmbedding(content);

      if (embedding && embedding.length === EMBEDDING_DIM) {
        // Update the memory with embedding
        const vectorStr = JSON.stringify(embedding);
        await client.execute({
          sql: `UPDATE memories SET embedding = vector(?) WHERE id = ?`,
          args: [vectorStr, id],
        });
        process.stdout.write(` ✅\n`);
        success++;
      } else {
        process.stdout.write(` ❌ (${embedding ? `dim=${embedding.length}` : "null"})\n`);
        failed++;
      }

      processed++;
      if (processed >= toProcess) break;

      // Small delay to avoid overwhelming Ollama
      await new Promise(r => setTimeout(r, 50));
    }

    // Progress report
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const eta = (toProcess - processed) / rate;
    console.log(`\n📈 Progress: ${processed}/${toProcess} (${(processed/toProcess*100).toFixed(1)}%)`);
    console.log(`   Success: ${success}, Failed: ${failed}`);
    console.log(`   Rate: ${rate.toFixed(1)}/sec, ETA: ${(eta/60).toFixed(1)} min`);
  }

  // Final summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 BACKFILL COMPLETE");
  console.log(`   Processed: ${processed}`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Duration: ${((Date.now() - startTime)/1000/60).toFixed(1)} minutes`);

  // Verify final counts
  const finalCount = await client.execute(
    "SELECT COUNT(id) as count FROM memories WHERE embedding IS NULL"
  );
  console.log(`\n   Remaining without embeddings: ${finalCount.rows[0].count}`);
}

// Main
const client = createClient({ url: `file:${dbPath}` });
await client.execute("PRAGMA busy_timeout = 10000");
backfill(client)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
