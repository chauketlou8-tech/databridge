import type { DriverFactory as DRF } from "../interfaces/DriverFactory";
import type { Driver } from "../interfaces/Driver";
import type { Config } from "../types/config";
import { ProviderError } from "../exceptions";

class DriverFactory implements DRF {
    private readonly provider: string;
    private readonly config: Config;

    constructor(provider: string, config: Config) {
        this.provider = provider;
        this.config = config;
    }

    /**
     * Creates a new DriverFactory instance
     * @returns {DriverFactory} New DriverFactory instance
     */
    public create(): DriverFactory {
        return new DriverFactory(this.provider, this.config);
    }

    /**
     * Establishes a connection and returns a Driver instance
     * @returns {Promise<Driver>} Database driver instance
     * @throws {ProviderError} If provider is not supported
     */
    public async connect(): Promise<null> {
        // TODO: Implement connection logic for each provider
        // will add connection logic

        if (!this.isProviderSupported()) {
            throw new ProviderError(`Provider "${this.provider}" is not supported`, "D005");
        }

        return null
    }

    /**
     * Checks if the provider is supported
     * @returns {boolean} True if provider is supported
     */
    private isProviderSupported(): boolean {
        const supportedProviders = ["postgres", "mysql", "mongodb", "sqlite"];
        return supportedProviders.includes(this.provider);
    }
}