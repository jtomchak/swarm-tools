# Database Path Audit Report

**Epic**: Single Global Database - Kill All Strays  
**Cell**: opencode-swarm-monorepo-lf2p4u-mju8bj42ho4  
**Date**: 2025-12-31  
**Agent**: CalmWind

## Executive Summary

Audited **ALL** code paths that create or reference database files in the monorepo. Found:
- **1 CRITICAL STALE REFERENCE** requiring immediate fix
- **31 CORRECT** references to global path `~/.config/swarm-tools/swarm.db`
- **98+ CORRECT** `getSwarmMailLibSQL` callers (all delegate to correct global path)
- **42 LEGACY** `streams.db` references (migration-related, should be deprecated)
- **100+ TEST** references using `:memory:` (correct, no changes needed)

## CRITICAL - Immediate Action Required

### ❌ WRONG - Active Stale Reference

**File**: `packages/opencode-swarm-plugin/src/query-tools.ts:213-217`
```typescript
/**
 * Get database path from project path.
 * Uses global database (~/.swarm-tools/swarm-mail.db)
 */
function getDbPath(): string {
	const home = homedir();
	return join(home, ".swarm-tools", "swarm-mail.db");
}
```

**Status**: STALE - References old path `~/.swarm-tools/swarm-mail.db`  
**Should be**: `~/.config/swarm-tools/swarm.db`  
**Impact**: Query tools will fail to find the global database  
**Fix**: Update to use `getGlobalDbPath()` from `swarm-mail/src/streams/auto-migrate.ts`

---

## ✅ CORRECT - Global Path References

### Primary Global Path Function

**File**: `packages/swarm-mail/src/streams/auto-migrate.ts:136-138`
```typescript
export function getGlobalDbPath(): string {
	return join(homedir(), ".config", "swarm-tools", "swarm.db");
}
```
**Status**: ✅ CORRECT - Canonical global path function  
**Used by**: Migration system, auto-migration, CLI tools

---

### getDatabasePath - The Correct Path Function

**File**: `packages/swarm-mail/src/streams/index.ts:91-113`
```typescript
export function getDatabasePath(projectPath?: string): string {
	const globalDir = join(homedir(), ".config", "swarm-tools");
	if (!existsSync(globalDir)) {
		mkdirSync(globalDir, { recursive: true });
	}
	const globalDbPath = join(globalDir, "swarm.db");
	
	// Auto-migrate project-local DBs to global DB
	if (projectPath) {
		const oldPaths = getOldProjectDbPaths(projectPath);
		
		// Check for old libSQL database (.opencode/streams.db)
		if (existsSync(oldPaths.libsql)) {
			// Trigger migration - runs async but we don't wait
			// Idempotent: safe to call multiple times, skips if .migrated exists
			migrateLocalDbToGlobal(oldPaths.libsql, globalDbPath).catch((err) => {
				console.error(`[swarm-mail] Migration failed: ${err.message}`);
			});
		}
	}
	
	return globalDbPath;
}
```
**Status**: ✅ CORRECT - Primary database path resolver  
**Behavior**: ALWAYS returns `~/.config/swarm-tools/swarm.db`, triggers auto-migration if local DB exists

---

### getSwarmMailLibSQL - All Callers Are Correct

**File**: `packages/swarm-mail/src/libsql.convenience.ts:133-159`
```typescript
export async function getSwarmMailLibSQL(
  projectPath?: string,
): Promise<SwarmMailAdapter> {
  const key = projectPath || "__global__";

  // Return existing instance if available
  if (instances.has(key)) {
    return instances.get(key)!;
  }

  // CRITICAL: Use the shared adapter cache from store.ts to ensure
  // all callers (sendSwarmMessage, getInbox, appendEvent) use the SAME adapter.
  const { getOrCreateAdapter } = await import("./streams/store.js");
  const db = await getOrCreateAdapter(undefined, projectPath);

  // Initialize memory schema (streams schema already initialized by getOrCreateAdapter)
  await createLibSQLMemorySchema((db as any).getClient());

  const projectKey = projectPath || "global";
  const adapter = createSwarmMailAdapter(db, projectKey);

  // Cache instance
  instances.set(key, adapter);

  return adapter;
}
```
**Status**: ✅ CORRECT - Delegates to `getOrCreateAdapter` which calls `getDatabasePath`  
**Callers** (98+ files): ALL CORRECT - they all use `getSwarmMailLibSQL` which resolves to global path

#### Sampling of Correct Callers:

1. `packages/opencode-swarm-plugin/src/memory.ts:265`
2. `packages/opencode-swarm-plugin/bin/swarm.ts:4230,4825,5377,5438`
3. `packages/opencode-swarm-plugin/src/hive.ts:512,1526`
4. `packages/opencode-swarm-plugin/src/swarm-orchestrate.ts:1469,2815`
5. `packages/opencode-swarm-plugin/src/hivemind-tools.ts:96,118,156,455`
6. `packages/opencode-swarm-plugin/src/cass-tools.ts:97`
7. `packages/opencode-swarm-plugin/src/observability-tools.ts:187,289,370,509,745`
8. `packages/opencode-swarm-plugin/src/eval-capture.ts:629`
9. `packages/opencode-swarm-plugin/src/dashboard.ts:61,140,206,270,334`
10. `packages/opencode-swarm-plugin/src/skills.ts:109,135`
11. `packages/opencode-swarm-plugin/src/memory-tools.ts:85`
12. `packages/swarm-mail/src/streams/swarm-mail.ts:712-714`

**Total**: 98+ references, ALL correctly delegating to global path via `getDatabasePath()`

---

### CLI Default Paths

**File**: `packages/swarm-mail/bin/swarm-db.ts:36,55`
```typescript
const DEFAULT_DB = join(homedir(), ".config/swarm-tools", "swarm.db");

// Usage:
//   --db <path>             Database path (default: ~/.config/swarm-tools/swarm.db)
```
**Status**: ✅ CORRECT - CLI uses correct default

---

### Test References (Correct - Hardcoded Expectations)

**Files**:
- `packages/swarm-mail/src/streams/index.test.ts:83,97,110,144,188,203`
- `packages/swarm-mail/src/streams/events.test.ts:1706,1719`
- `packages/swarm-mail/src/streams/auto-migrate.test.ts:58,62`

**Status**: ✅ CORRECT - Tests verify global path `~/.config/swarm-tools/swarm.db`

---

## 📂 LEGACY - Migration-Related References

### Old Local DB Paths (streams.db)

These references are part of the migration system that converts old local databases to the global database. They are CORRECT for their purpose (detecting and migrating old DBs), but represent legacy patterns that should be deprecated.

#### Auto-Migration Detection

**File**: `packages/swarm-mail/src/streams/auto-migrate.ts:125,147,215`
```typescript
const libsqlPath = join(projectPath, ".opencode", "streams.db");
```
**Status**: 📂 LEGACY - Used for migration detection  
**Purpose**: Find old local DBs to migrate  
**Keep?**: YES - needed for migration until all local DBs are migrated

---

**File**: `packages/swarm-mail/src/streams/index.ts:102,119,135`
```typescript
// Check for old libSQL database (.opencode/streams.db)
if (existsSync(oldPaths.libsql)) {
	migrateLocalDbToGlobal(oldPaths.libsql, globalDbPath).catch((err) => {
		console.error(`[swarm-mail] Migration failed: ${err.message}`);
	});
}

// ...
libsql: join(localDir, "streams.db"),
```
**Status**: 📂 LEGACY - Auto-migration trigger  
**Purpose**: Detect and migrate old `streams.db` files  
**Keep?**: YES - actively used for migration

---

#### Test Migration Code

**Files**:
- `packages/swarm-mail/src/streams/index.test.ts:126,143,202`
- `packages/swarm-mail/src/streams/auto-migrate.test.ts:39,65,66,94,205,237`
- `packages/swarm-mail/src/migrate-pglite-to-libsql.integration.test.ts:26`
- `packages/swarm-mail/src/db/worktree.test.ts:102,109`
- `packages/swarm-mail/scripts/test-migration.ts:21`

**Status**: 📂 LEGACY - Test migration scenarios  
**Keep?**: YES - ensure migration works correctly

---

### Old swarm-mail.db References

**File**: `packages/swarm-mail/src/streams/auto-migrate.ts:179,253`
```typescript
/**
 * @param globalDbPath - path to global database (defaults to ~/.opencode/swarm-mail.db)
 */

// Example:
// const globalDb = createClient({ url: "file:~/.opencode/swarm-mail.db" });
```
**Status**: 📂 LEGACY - Documentation only, not actual code  
**Fix**: Update docs to reference `~/.config/swarm-tools/swarm.db`

---

## 🧪 TEST - In-Memory References (Correct)

### :memory: Database Usage

**Pattern**: `createClient({ url: ":memory:" })`  
**Count**: 100+ occurrences  
**Status**: ✅ CORRECT - Tests use in-memory DBs, no persistence  
**Examples**:
- `packages/swarm-mail/src/db/client.ts:77`
- `packages/swarm-mail/src/memory/adapter.test.ts:71`
- `packages/swarm-mail/src/memory/migrations.test.ts:39`
- `packages/swarm-mail/src/hive/migrations.test.ts:44`
- ... (95+ more test files)

**Keep?**: YES - standard test pattern

---

## 📝 DOCUMENTATION - .opencode/ References

These references are primarily in documentation, comments, and skill directory references. They do NOT create database files.

### Skill Directory References

**Pattern**: `.opencode/skill/`, `.opencode/skills/`  
**Purpose**: Location for project-specific skills  
**Status**: ✅ CORRECT - Skills, not databases  
**Files**:
- `packages/opencode-swarm-plugin/bin/swarm.ts:1717,2607,2612,2717`
- `packages/opencode-swarm-plugin/examples/plugin-wrapper-template.ts:1264`
- `packages/opencode-swarm-plugin/src/skills.ts:9,242,352,482,710,947,976,984,1424,1426`

**Keep?**: YES - unrelated to database paths

---

### Eval History/Data References

**Pattern**: `.opencode/eval-history.jsonl`, `.opencode/eval-data.jsonl`  
**Purpose**: Evaluation capture data  
**Status**: ✅ CORRECT - JSONL files, not databases  
**Files**:
- `packages/opencode-swarm-plugin/src/eval-capture.ts:223`
- `packages/opencode-swarm-plugin/src/eval-history.ts:36,70,73,174`
- `packages/opencode-swarm-plugin/src/eval-history.test.ts:48,78,124`
- `packages/opencode-swarm-plugin/src/eval-gates.ts:103`

**Keep?**: YES - unrelated to database paths

---

### Agent Discovery References

**Pattern**: `/Users/joel/.opencode/session.jsonl`  
**Purpose**: Agent type detection from session paths  
**Status**: ✅ CORRECT - Session files, not databases  
**Files**:
- `packages/opencode-swarm-plugin/src/sessions/agent-discovery.test.ts:33,61`

**Keep?**: YES - unrelated to database paths

---

## 🔧 WORKTREE - Temporary Test Databases

### Worktree Database Path Resolution

**File**: `packages/swarm-mail/src/db/worktree.ts:70,73`
```typescript
/**
 * @param filename - Database filename (default: "swarm.db")
 */
export function resolveDbPath(path: string, filename = "swarm.db"): string {
```
**Status**: 🔧 WORKTREE - Used for worktree isolation in tests  
**Purpose**: Allow tests to use project-local DBs in worktrees  
**Keep?**: REVIEW - may not be needed with global DB model

---

**File**: `packages/swarm-mail/src/db/client.test.ts:91-92,101`
```typescript
// Should return path to .opencode/swarm.db
expect(dbPath).toBe("/path/to/project/.opencode/swarm.db");
```
**Status**: 🔧 WORKTREE - Test expectations  
**Keep?**: REVIEW - update tests if worktree logic changes

---

## 📊 Summary by Category

| Category | Count | Status | Action Required |
|----------|-------|--------|-----------------|
| **WRONG** (Active Stale) | 1 | ❌ | **FIX IMMEDIATELY** |
| **CORRECT** (Global Path) | 31 | ✅ | Keep as-is |
| **CORRECT** (`getSwarmMailLibSQL`) | 98+ | ✅ | Keep as-is |
| **LEGACY** (Migration) | 42 | 📂 | Keep for now, deprecate later |
| **TEST** (`:memory:`) | 100+ | ✅ | Keep as-is |
| **DOCUMENTATION** (Skills, Eval) | 50+ | ✅ | Keep as-is |
| **WORKTREE** (Temp DBs) | 5 | 🔧 | Review & update tests |

---

## 🎯 Recommended Actions

### Immediate (High Priority)

1. **Fix `query-tools.ts`** - Update `getDbPath()` to use correct global path
   ```typescript
   // BEFORE
   return join(home, ".swarm-tools", "swarm-mail.db");
   
   // AFTER
   import { getGlobalDbPath } from "swarm-mail";
   return getGlobalDbPath();
   ```

2. **Verify no other `~/.swarm-tools/` references exist**
   ```bash
   grep -r "\.swarm-tools" --include="*.ts" | grep -v test | grep -v "config/swarm-tools"
   ```

### Short-term (Medium Priority)

3. **Update documentation** in `auto-migrate.ts` to reference correct path
   - Line 179: `~/.opencode/swarm-mail.db` → `~/.config/swarm-tools/swarm.db`
   - Line 253: `~/.opencode/swarm-mail.db` → `~/.config/swarm-tools/swarm.db`

4. **Review worktree database logic**
   - Does `resolveDbPath` need to exist with global DB model?
   - Update tests if worktree-specific DBs are no longer needed

### Long-term (Low Priority)

5. **Deprecate `streams.db` after migration complete**
   - Once all local DBs are migrated, remove migration detection code
   - Clean up test fixtures using old `streams.db` paths

6. **Audit actual filesystem** for stray databases
   ```bash
   find ~/.config/swarm-tools -name "*.db"
   find .opencode -name "*.db" 2>/dev/null
   find .hive -name "*.db" 2>/dev/null
   ```

---

## 🔍 Search Patterns Used

```bash
# Patterns searched (via grep):
swarm\.db
swarm-mail\.db
\.opencode/
getSwarmMailLibSQL
getGlobalDbPath
createClient
~/.config/swarm-tools
~/.swarm-tools
\.hive.*db
streams\.db
```

---

## 📈 Confidence Level

**HIGH** - Comprehensive audit covering:
- ✅ All `swarm.db` literal references (31 found)
- ✅ All `swarm-mail.db` literal references (4 found)
- ✅ All `getSwarmMailLibSQL` calls (98+ found)
- ✅ All `createClient` calls (100+ found)
- ✅ All `.opencode/` directory references (50+ found)
- ✅ All `streams.db` references (42 found)
- ✅ Path construction functions (`getGlobalDbPath`, `getDatabasePath`)

**RISK**: Low - Only 1 active stale reference found, easy to fix

---

## 🎬 Next Steps

1. **Fix** `query-tools.ts` immediately (Cell: opencode-swarm-monorepo-lf2p4u-mju8bj42ho4)
2. **Test** query tools after fix
3. **Verify** global DB is being used by all code paths
4. **Schedule** filesystem audit for stray DB cleanup
5. **Plan** migration deprecation once all local DBs migrated

---

**Audit Complete** ✅  
**Agent**: CalmWind  
**Date**: 2025-12-31
