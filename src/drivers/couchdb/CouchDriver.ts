import Driver from "../Driver";
import type { Config } from "../../types/config";
import type { Query } from "../../types/query";
import { DriverError, ConnectionError } from "../../exceptions";
import CouchQuery from "./CouchQuery";
import nano from "nano";

export class CouchDriver extends Driver {
    private connection: any | null = null;
    private db: any | null = null;

    constructor(config: Config) {
        super(config);
    }

    public async connect(): Promise<void> {
        if (!this.config.url) {
            throw new DriverError("The connection URL is missing or empty", "D024");
        }

        if (!this.config.database) {
            throw new DriverError("Database name is missing or empty", "D026");
        }

        try {
            this.connection = nano(this.config.url);
            this.db = this.connection.db.use(this.config.database);
        } catch (error) {
            throw new ConnectionError(`Failed to connect to CouchDB: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        this.connection = null;
        this.db = null;
    }

    public async query(query: Query): Promise<any> {
        if (!this.connection || !this.db) {
            throw new ConnectionError("Not connected to database", "D015");
        }

        return await new CouchQuery(query, this.db).run();
    }
}