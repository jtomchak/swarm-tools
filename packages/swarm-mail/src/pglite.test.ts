/**
 * Tests for PGlite deprecation utilities
 *
 * @deprecated This entire module will be removed in the next major version
 */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
	_resetDeprecationFlag,
	warnPGliteDeprecation,
	wrapPGlite,
} from "./pglite.js";

describe("warnPGliteDeprecation", () => {
	let consoleWarnSpy: ReturnType<typeof mock>;

	beforeEach(() => {
		// Reset the module-level flag between tests
		_resetDeprecationFlag();
		consoleWarnSpy = mock(() => {});
		console.warn = consoleWarnSpy;
	});

	test("warns on first call", () => {
		warnPGliteDeprecation();

		expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"[DEPRECATION] PGlite is deprecated and will be removed in the next major version. Please migrate to libSQL using migratePGliteToLibSQL()."
		);
	});

	test("does not warn on subsequent calls (once per session)", () => {
		warnPGliteDeprecation();
		warnPGliteDeprecation();
		warnPGliteDeprecation();

		expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
	});
});

describe("wrapPGlite", () => {
	let consoleWarnSpy: ReturnType<typeof mock>;
	let mockPGlite: {
		query: ReturnType<typeof mock>;
		exec: ReturnType<typeof mock>;
		close: ReturnType<typeof mock>;
	};

	beforeEach(() => {
		_resetDeprecationFlag();
		consoleWarnSpy = mock(() => {});
		console.warn = consoleWarnSpy;

		// Mock PGlite instance
		mockPGlite = {
			query: mock(async () => ({ rows: [] })),
			exec: mock(async () => {}),
			close: mock(async () => {}),
		};
	});

	test("warns on first wrap call", () => {
		wrapPGlite(mockPGlite);

		expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
	});

	test("returns DatabaseAdapter interface", () => {
		const adapter = wrapPGlite(mockPGlite);

		expect(adapter).toHaveProperty("query");
		expect(adapter).toHaveProperty("exec");
		expect(adapter).toHaveProperty("transaction");
		expect(adapter).toHaveProperty("close");
	});

	test("query() delegates to pglite.query()", async () => {
		const adapter = wrapPGlite(mockPGlite);
		mockPGlite.query = mock(async () => ({ rows: [{ id: 1 }] }));

		const result = await adapter.query("SELECT * FROM test", [123]);

		expect(mockPGlite.query).toHaveBeenCalledWith("SELECT * FROM test", [123]);
		expect(result.rows).toEqual([{ id: 1 }]);
	});

	test("exec() delegates to pglite.exec()", async () => {
		const adapter = wrapPGlite(mockPGlite);

		await adapter.exec("CREATE TABLE test (id INTEGER)");

		expect(mockPGlite.exec).toHaveBeenCalledWith("CREATE TABLE test (id INTEGER)");
	});

	test("close() delegates to pglite.close()", async () => {
		const adapter = wrapPGlite(mockPGlite);

		await adapter.close();

		expect(mockPGlite.close).toHaveBeenCalledTimes(1);
	});

	test("transaction() executes function with adapter", async () => {
		const adapter = wrapPGlite(mockPGlite);

		const result = await adapter.transaction(async (tx) => {
			expect(tx).toBe(adapter);
			return "success";
		});

		expect(result).toBe("success");
	});
});
