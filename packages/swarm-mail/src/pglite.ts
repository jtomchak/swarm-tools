/**
 * PGlite Adapter (DEPRECATED)
 *
 * This module provides backward compatibility for PGlite databases.
 * It wraps PGlite instances as DatabaseAdapter and warns about deprecation.
 *
 * @deprecated This entire module will be removed in the next major version.
 * Migrate to libSQL using migratePGliteToLibSQL().
 *
 * @module pglite
 */

import type { DatabaseAdapter } from "./types/database.js";

/**
 * Module-level flag to warn once per session
 * @internal
 */
let _pgliteDeprecationWarned = false;

/**
 * Reset deprecation flag (for testing only)
 * @internal
 */
export function _resetDeprecationFlag(): void {
	_pgliteDeprecationWarned = false;
}

/**
 * Warn about PGlite deprecation (once per session)
 *
 * Logs a deprecation warning to console.warn() on first call.
 * Subsequent calls are silent to avoid log spam.
 *
 * @example
 * ```typescript
 * import { warnPGliteDeprecation } from 'swarm-mail';
 *
 * warnPGliteDeprecation(); // Warns
 * warnPGliteDeprecation(); // Silent
 * ```
 */
export function warnPGliteDeprecation(): void {
	if (!_pgliteDeprecationWarned) {
		console.warn(
			"[DEPRECATION] PGlite is deprecated and will be removed in the next major version. Please migrate to libSQL using migratePGliteToLibSQL()."
		);
		_pgliteDeprecationWarned = true;
	}
}

/**
 * Wrap a PGlite instance as a DatabaseAdapter
 *
 * Provides a DatabaseAdapter interface around a PGlite instance.
 * Warns about deprecation on first call.
 *
 * @param pglite - PGlite database instance
 * @returns DatabaseAdapter wrapping the PGlite instance
 *
 * @deprecated Use libSQL via createLibSQLAdapter() instead.
 * This function will be removed in the next major version.
 *
 * @example
 * ```typescript
 * import { PGlite } from '@electric-sql/pglite';
 * import { wrapPGlite } from 'swarm-mail';
 *
 * const pglite = await PGlite.create({ dataDir: './data' });
 * const adapter = wrapPGlite(pglite);
 *
 * await adapter.query('SELECT * FROM users');
 * ```
 */
export function wrapPGlite(pglite: {
	query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
	exec: (sql: string) => Promise<void>;
	close: () => Promise<void>;
}): DatabaseAdapter {
	warnPGliteDeprecation();

	return {
		async query<T = unknown>(sql: string, params?: unknown[]) {
			const result = await pglite.query(sql, params);
			return { rows: result.rows as T[] };
		},
		async exec(sql: string) {
			await pglite.exec(sql);
		},
		async transaction<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
			return await fn(this);
		},
		async close() {
			await pglite.close();
		},
	};
}
