/**
 * DataBridge - Main entry point for the database abstraction layer
 *
 * This class implements the DataBridge interface and provides
 * the primary API for connecting to databases.
 */
import Database from "./Database";
import type { Config } from "../types/config";
import { ProviderError } from "../exceptions";
import DriverFactory from "../drivers/DriverFactory";

export class DataBridge {

    /**
     * Establishes a connection to a database
     *
     * @param config - Database connection configuration
     * @param config.provider - Database provider (postgres, mysql, mongodb, sqlite)
     * @param config.url - Connection URL string
     * @param config.host - Database host (alternative to url)
     * @param config.port - Database port (alternative to url)
     * @param config.user - Database user (alternative to url)
     * @param config.password - Database password (alternative to url)
     * @param config.database - Database name (alternative to url)
     * @param config.filename - Database file (alternative for sqlite)
     * @param config.options - Additional provider-specific options
     *
     * @returns Promise resolving to a Database instance
     *
     * @throws {ProviderError} If provider is missing or invalid
     * @throws {Error} If connection fails
     *
     * @example
     * ```typescript
     * const db = await databridge.connect({
     *   provider: "postgres",
     *   url: "postgres://localhost:5432/myapp"
     * });
     * ```
     */
    public static async connect(config: Config): Promise<Database> {
        // Validate provider
        if (!config.provider) {
            throw new ProviderError("No database provider was specified.","D001");
        }

        const driver = DriverFactory.createDriver(config.provider, config);
        await driver.connect(config);

        return new Database(driver);
    }
}