/**
 * CLI entry point for the DataBridge command-line interface.
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
            console.log(`DataBridge v${version}`);
            break;

        case "help":
            console.log(`
Usage: databridge <command>

Commands:
  version              Display the current version
  help                 Show this help message
  drivers              List all available drivers

Examples:
  databridge version
  databridge help
  databridge drivers

For more information, visit:
  https://databridge-documentation.vercel.app
`);
            break;

        case "drivers":
            console.log("\nAvailable Drivers:");
            console.log("  PostgreSQL  - Production-ready SQL database");
            console.log("  MySQL       - World's most popular open-source database");
            console.log("  MariaDB     - High-performance MySQL fork");
            console.log("  MongoDB     - Flexible NoSQL document database");
            console.log("  SQLite      - Lightweight embedded SQL database");
            console.log("  CouchDB     - NoSQL document database with HTTP API");
            console.log();
            console.log("Usage:");
            console.log("  const db = await DataBridge.connect({");
            console.log("    provider: 'postgres',");
            console.log("    url: 'postgres://localhost:5432/database'");
            console.log("  });");
            break;

        default:
            console.error(`Unknown command: "${command || "No command entered"}"`);
            console.log();
            console.log("To see a list of supported commands, run:");
            console.log("  databridge help");
            process.exit(1);
    }
};

export default cli;