import type { Driver as DRV } from "../interfaces/Driver";
import type { Config } from "../types/config";

export default abstract class Driver implements DRV {
    protected readonly config: Config;

    protected constructor(config: Config) {
        this.config = config;
    }

    public async connect(config: Config): Promise<void> {
    }

    public async disconnect(): Promise<void> {

    }

    public async query(sql: string): Promise<any> {

    }
}