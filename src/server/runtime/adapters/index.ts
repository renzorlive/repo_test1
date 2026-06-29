/**
 * Importing this module registers every built-in runtime adapter. The runtime
 * engine imports it so adapters are available wherever jobs are dispatched.
 *
 * Future runtimes (Codex CLI, Gemini CLI, Cursor CLI, local agents, Docker,
 * SSH) add one import line here — no engine changes.
 */
import "./claude-code";
