/**
 * CLI entry point for the DataBridge command-line interfaces.
 *
 * Handles terminal commands and routes them to the appropriate handlers.
 *
 * The CLI parses command-line arguments, validates them, and executes
 * the corresponding command logic.
 */
import version from "../version";

const cli = () => {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case "version":
            console.log(version);
            break;

        case "help":
            console.log(`
Usage: databridge <command>

Commands:
  version    Display the current version
  help       Show this help message

Examples:
  databridge version
  databridge help

For more information, visit:
  https://databridge-documentation.vercel.app
`);
            break;

        default:
            console.error(`Unknown command: "${command || "No command entered"}"`);
            console.log();
            console.log("To see a list of supported commands, run:");
            console.log("  databridge help");
            process.exit(1);
    }
}

//cli()

export default cli;