/**
 * CLI entry point for the DataBridge command-line interface.
 *
 * Handles terminal commands and routes them to the appropriate handlers.
 *
 * The CLI parses command-line arguments, validates them, and executes
 * the corresponding command logic.
 */

import version from "../version";

const [...args] = process.argv.slice(3);

switch (args[0]) {
    case "-v":
        console.log(version);
        break;

    case "help":
        break;
    default:
        console.log(`Unknown command: "${args[0]}"

        To see a list of supported databridge commands, run:
        databridge help`)
        break;
}