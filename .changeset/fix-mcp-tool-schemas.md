---
"claude-code-swarm-plugin": patch
"swarm-tools": patch
---

fix(mcp): inline tool schemas to fix params arriving as undefined

The MCP server scraped tool definitions from `swarm tool --list --json` at
startup, but the CLI's `--list` handler never supported `--json`. The fallback
parsed colored text output and registered every tool with an empty JSON schema
(`properties: {}`), which converted to a Zod schema with no required fields.
The MCP SDK then treated all params as optional, delivering `undefined` to
every handler.

- **claude-code-swarm-plugin**: Replace runtime CLI scraping with static
  `TOOL_DEFINITIONS` array containing all 25 tools with proper JSON schemas
  (properties, required fields, types, descriptions)
- **swarm-tools**: Export `SWARM_TOOLS` from index.ts; MCP server imports
  canonical definitions instead of scraping CLI
- Remove dead `getToolDefinitions()`, `filterTools()`, unused `execSync` import

> "The most fundamental problem in computer science is problem decomposition:
> how to take a complex problem and divide it up into pieces that can be solved
> independently." — John Ousterhout, A Philosophy of Software Design
