/**
 * CLI entry point for the DataBridge command-line interface.
 *
 * Handles terminal commands and routes them to the appropriate handlers.
 *
 * The CLI parses command-line arguments, validates them, and executes
 * the corresponding command logic.
 */
import { version, help } from "./commands";

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case "version":
        version();
        break;

    case "help":
        help();
        break;

    default:
        console.error(`Unknown command: "${command || "No command entered"}"`);
        console.log();
        console.log("To see a list of supported commands, run:");
        console.log("  databridge help");
        process.exit(1);
}