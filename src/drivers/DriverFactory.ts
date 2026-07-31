import type { Driver } from "../interfaces/Driver";
import type { Config } from "../types/config";
import { ProviderError } from "../exceptions";

import { PostgreSQLDriver } from "./postgresql";
import { MongoDriver } from "./mongodb";
import { MysqlDriver } from "./mysql";
import { SQLiteDriver } from "./sqlite";

export default class DriverFactory {
    /**
     * Establishes a connection and returns a Driver instance
     * @returns {Promise<Driver>} Database driver instance
     * @throws {ProviderError} If provider is not supported
     */
    public static createDriver(provider: string, config: Config): Driver {
        // TODO: Implement connection logic for each provider
        // will add connection logic

        if (!DriverFactory.isProviderSupported(provider)) {
            throw new ProviderError(`Provider "${provider}" is not supported`, "D005");
        }

        let driver: Driver;

        switch (provider) {
            case "postgres":
                driver = new PostgreSQLDriver(config);
                break;

            case "mysql":
                driver = new MysqlDriver(config);
                break;

            case "mongodb":
                driver = new MongoDriver(config);
                break;

            case "sqlite":
                driver = new SQLiteDriver(config);
                break;

            default:
                throw new ProviderError("There was an error with the provider.", "D006");
        }

        return driver;
    }
    private static isProviderSupported(provider: string): boolean {
        const supportedProviders = ["postgres", "mysql", "mongodb", "sqlite"];
        return supportedProviders.includes(provider);
    }
}