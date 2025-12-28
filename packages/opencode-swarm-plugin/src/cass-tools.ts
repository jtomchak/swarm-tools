/**
 * CASS Tools - Cross-Agent Session Search
 *
 * Provides tools for searching across AI coding agent histories.
 * Wraps the external `cass` CLI from:
 * https://github.com/Dicklesworthstone/coding_agent_session_search
 *
 * Events emitted:
 * - cass_searched: When a search is performed
 * - cass_viewed: When a session is viewed
 * - cass_indexed: When the index is built/rebuilt
 */

import { tool } from "@opencode-ai/plugin";
import { execSync, spawn } from "child_process";
import { getSwarmMailLibSQL, createEvent } from "swarm-mail";

// ============================================================================
// Types
// ============================================================================

interface CassSearchArgs {
	query: string;
	agent?: string;
	days?: number;
	limit?: number;
	fields?: string;
}

interface CassViewArgs {
	path: string;
	line?: number;
}

interface CassExpandArgs {
	path: string;
	line: number;
	context?: number;
}

interface CassIndexArgs {
	full?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if cass CLI is available
 */
function isCassAvailable(): boolean {
	try {
		execSync("which cass", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

/**
 * Execute cass CLI command and return output
 */
async function execCass(args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		const proc = spawn("cass", args, {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (data) => {
			stdout += data;
		});
		proc.stderr.on("data", (data) => {
			stderr += data;
		});

		proc.on("close", (code) => {
			if (code === 0) {
				resolve(stdout);
			} else {
				reject(new Error(stderr || `cass exited with code ${code}`));
			}
		});

		proc.on("error", (err) => {
			if ((err as NodeJS.ErrnoException).code === "ENOENT") {
				reject(
					new Error(
						"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
					),
				);
			} else {
				reject(err);
			}
		});
	});
}

/**
 * Emit event to swarm-mail event store
 */
async function emitEvent(
	eventType: string,
	data: Record<string, unknown>,
): Promise<void> {
	try {
		const projectPath = process.cwd();
		const swarmMail = await getSwarmMailLibSQL(projectPath);

		const event = createEvent(eventType as any, {
			project_key: projectPath,
			...data,
		});

		await swarmMail.appendEvent(event);
	} catch {
		// Silently fail event emission - don't break the tool
	}
}

// ============================================================================
// Tools
// ============================================================================

/**
 * cass_search - Search across all AI coding agent histories
 */
const cass_search = tool({
	description:
		"Search across all AI coding agent histories (Claude, Codex, Cursor, Gemini, Aider, ChatGPT, Cline, OpenCode). Query BEFORE solving problems from scratch - another agent may have already solved it.",
	args: {
		query: tool.schema
			.string()
			.describe("Search query (e.g., 'authentication error Next.js')"),
		agent: tool.schema
			.string()
			.optional()
			.describe("Filter by agent name (e.g., 'claude', 'cursor')"),
		days: tool.schema
			.number()
			.optional()
			.describe("Only search sessions from last N days"),
		limit: tool.schema
			.number()
			.optional()
			.describe("Max results to return (default: 5)"),
		fields: tool.schema
			.string()
			.optional()
			.describe(
				"Field selection: 'minimal' for compact output (path, line, agent only)",
			),
	},
	async execute(args: CassSearchArgs): Promise<string> {
		const startTime = Date.now();

		if (!isCassAvailable()) {
			return JSON.stringify({
				error:
					"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
			});
		}

		try {
			// Build cass search command
			const cliArgs = ["search", args.query];

			if (args.agent) {
				cliArgs.push("--agent", args.agent);
			}
			if (args.days) {
				cliArgs.push("--days", String(args.days));
			}
			if (args.limit) {
				cliArgs.push("--limit", String(args.limit));
			}
			if (args.fields === "minimal") {
				cliArgs.push("--minimal");
			}

			const output = await execCass(cliArgs);

			// Parse output to count results
			const lines = output.trim().split("\n").filter((l) => l.trim());
			const resultCount = lines.length;

			// Emit event
			await emitEvent("cass_searched", {
				query: args.query,
				agent_filter: args.agent,
				days_filter: args.days,
				result_count: resultCount,
				search_duration_ms: Date.now() - startTime,
			});

			return output;
		} catch (error) {
			return JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	},
});

/**
 * cass_view - View a specific session from search results
 */
const cass_view = tool({
	description:
		"View a specific conversation/session from search results. Use source_path from cass_search output.",
	args: {
		path: tool.schema
			.string()
			.describe("Path to session file (from cass_search results)"),
		line: tool.schema
			.number()
			.optional()
			.describe("Jump to specific line number"),
	},
	async execute(args: CassViewArgs): Promise<string> {
		if (!isCassAvailable()) {
			return JSON.stringify({
				error:
					"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
			});
		}

		try {
			// Build cass view command
			const cliArgs = ["view", args.path];

			if (args.line) {
				cliArgs.push("--line", String(args.line));
			}

			const output = await execCass(cliArgs);

			// Detect agent type from path
			let agentType: string | undefined;
			if (args.path.includes("claude")) agentType = "claude";
			else if (args.path.includes("cursor")) agentType = "cursor";
			else if (args.path.includes("opencode")) agentType = "opencode";
			else if (args.path.includes("codex")) agentType = "codex";

			// Emit event
			await emitEvent("cass_viewed", {
				session_path: args.path,
				line_number: args.line,
				agent_type: agentType,
			});

			return output;
		} catch (error) {
			return JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	},
});

/**
 * cass_expand - Expand context around a specific line
 */
const cass_expand = tool({
	description:
		"Expand context around a specific line in a session. Shows messages before/after.",
	args: {
		path: tool.schema.string().describe("Path to session file"),
		line: tool.schema.number().describe("Line number to expand around"),
		context: tool.schema
			.number()
			.optional()
			.describe("Number of lines before/after to show (default: 5)"),
	},
	async execute(args: CassExpandArgs): Promise<string> {
		if (!isCassAvailable()) {
			return JSON.stringify({
				error:
					"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
			});
		}

		try {
			// Build cass expand command
			const cliArgs = ["expand", args.path, "--line", String(args.line)];

			if (args.context) {
				cliArgs.push("--context", String(args.context));
			}

			const output = await execCass(cliArgs);

			// Emit cass_viewed event (expand is a form of viewing)
			await emitEvent("cass_viewed", {
				session_path: args.path,
				line_number: args.line,
			});

			return output;
		} catch (error) {
			return JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	},
});

/**
 * cass_health - Check if cass index is healthy
 */
const cass_health = tool({
	description:
		"Check if cass index is healthy. Exit 0 = ready, Exit 1 = needs indexing. Run this before searching.",
	args: {},
	async execute(): Promise<string> {
		if (!isCassAvailable()) {
			return JSON.stringify({
				healthy: false,
				error:
					"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
			});
		}

		try {
			await execCass(["health"]);
			return JSON.stringify({ healthy: true, message: "Index is ready" });
		} catch (error) {
			return JSON.stringify({
				healthy: false,
				message: "Index needs rebuilding. Run cass_index()",
				error: error instanceof Error ? error.message : String(error),
			});
		}
	},
});

/**
 * cass_index - Build or rebuild the search index
 */
const cass_index = tool({
	description:
		"Build or rebuild the search index. Run this if health check fails or to pick up new sessions.",
	args: {
		full: tool.schema
			.boolean()
			.optional()
			.describe("Force full rebuild (default: incremental)"),
	},
	async execute(args: CassIndexArgs): Promise<string> {
		const startTime = Date.now();

		if (!isCassAvailable()) {
			return JSON.stringify({
				error:
					"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
			});
		}

		try {
			// Build cass index command
			const cliArgs = ["index"];

			if (args.full) {
				cliArgs.push("--full");
			}

			const output = await execCass(cliArgs);

			// Parse output to get stats
			let sessionsIndexed = 0;
			let messagesIndexed = 0;

			const sessionsMatch = output.match(/(\d+)\s*sessions?/i);
			const messagesMatch = output.match(/(\d+)\s*messages?/i);

			if (sessionsMatch) sessionsIndexed = parseInt(sessionsMatch[1], 10);
			if (messagesMatch) messagesIndexed = parseInt(messagesMatch[1], 10);

			// Emit event
			await emitEvent("cass_indexed", {
				sessions_indexed: sessionsIndexed,
				messages_indexed: messagesIndexed,
				duration_ms: Date.now() - startTime,
				full_rebuild: args.full ?? false,
			});

			return output;
		} catch (error) {
			return JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	},
});

/**
 * cass_stats - Show index statistics
 */
const cass_stats = tool({
	description:
		"Show index statistics - how many sessions, messages, agents indexed.",
	args: {},
	async execute(): Promise<string> {
		if (!isCassAvailable()) {
			return JSON.stringify({
				error:
					"cass CLI not found. Install from: https://github.com/Dicklesworthstone/coding_agent_session_search",
			});
		}

		try {
			const output = await execCass(["stats"]);
			return output;
		} catch (error) {
			return JSON.stringify({
				error: error instanceof Error ? error.message : String(error),
			});
		}
	},
});

// ============================================================================
// Exports
// ============================================================================

export const cassTools = {
	cass_search,
	cass_view,
	cass_expand,
	cass_health,
	cass_index,
	cass_stats,
};
