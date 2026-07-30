/**
 * Displays help information for DataBridge CLI commands.
 */
export default function help() {
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
}