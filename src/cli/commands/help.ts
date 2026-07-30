/**
 * Displays help information for DataBridge CLI commands.
 */
export default function help() {
    console.log(`
Usage: databridge <command>

Commands:
  version    Display the current version
  help       Show this help message
  init       Initialize a new DataBridge project
  connect    Connect to a database

Examples:
  databridge version
  databridge help
  databridge init my-project
  databridge connect --provider postgres

For more information, visit:
  https://databridge-documentation.vercel.app
`);
}