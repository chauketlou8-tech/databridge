import type { Driver as DRV } from "../interfaces/Driver";
import type { Config } from "../types/config";

export default abstract class Driver implements DRV {
    protected readonly config: Config;

    protected constructor(config: Config) {
        this.config = config;
    }

    public abstract async connect(config: Config): Promise<void> {
    }

    public abstract async disconnect(): Promise<void> {

    }

    public abstract async query(query: Query): Promise<void> {
    }
}