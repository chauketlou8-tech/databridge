import type { Driver } from "../interfaces/Driver";
import type { Config } from "../types/config";
import { ProviderError } from "../exceptions";

import { PostgreSQLDriver } from "./postgresql";

export default class DriverFactory {
    /**
     * Establishes a connection and returns a Driver instance
     * @returns {Promise<Driver>} Database driver instance
     * @throws {ProviderError} If provider is not supported
     */
    public static createDriver(provider: string, config: Config): Promise<Driver> {
        // TODO: Implement connection logic for each provider
        // will add connection logic

        if (!DriverFactory.isProviderSupported(provider)) {
            throw new ProviderError(`Provider "${provider}" is not supported`, "D005");
        }

        let driver: any = "postgresql";

        switch (provider) {
            case "postgres":
                driver = new PostgreSQLDriver(config);
                break;

            case "mysql":
                break;

            case "mongodb":
                break;

            case "sqlite":
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