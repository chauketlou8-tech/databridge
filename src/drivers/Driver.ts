import type { Driver as DRV } from "../interfaces/Driver";
import type { Config } from "../types/config";
import type { Query } from "../types/query";
import type { Model } from "../model";

export default abstract class Driver implements DRV {
    protected readonly config: Config;

    protected constructor(config: Config) {
        this.config = config;
    }

    public abstract connect(config: Config): Promise<void>
    public abstract disconnect(): Promise<void>
    public abstract query(model: Model | null, query: Query): Promise<void>
}