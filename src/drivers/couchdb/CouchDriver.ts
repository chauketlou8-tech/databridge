import Driver from "../Driver";
import type { Config } from "../../types/config";
import type { Query } from "../../types/query";
import { DriverError, ConnectionError, SchemaError } from "../../exceptions";
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
            // Validate URL format before passing to nano
            try {
                new URL(this.config.url);
            } catch (urlError: any) {
                if (urlError.code === 'ERR_INVALID_URL') {
                    throw new DriverError(`Invalid connection URL format: "${this.config.url}". Expected format: http://username:password@host:port`, "D013");
                }
                throw urlError;
            }

            this.connection = nano(this.config.url);

            const validDbName = /^[a-z][a-z0-9_$()+/-]*$/;
            if (!validDbName.test(this.config.database)) {
                throw new DriverError(`Invalid database name "${this.config.database}". CouchDB database names must start with a letter and contain only lowercase letters, numbers, and special characters _ $ ( ) + - /`, "D006");
            }

            try {
                await this.connection.db.get(this.config.database);
                // If we get here, database exists
                throw new SchemaError(`Database "${this.config.database}" already exists`, "D043");
            } catch (error: any) {
                if (error.statusCode === 404) {
                    // Database doesn't exist, create it
                    await this.connection.db.create(this.config.database);
                } else if (error.statusCode === 401) {
                    throw new ConnectionError("Authentication failed. Invalid username or password.", "D011");
                } else if (error.statusCode === 403) {
                    throw new ConnectionError("Permission denied. You don't have access to this database.", "D011");
                } else if (error.statusCode === 412) {
                    throw new SchemaError(`Database "${this.config.database}" already exists with different settings`, "D043");
                } else {
                    throw error;
                }
            }

            this.db = this.connection.db.use(this.config.database);
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                throw new ConnectionError(`Failed to connect to CouchDB: Connection refused. Is CouchDB running on ${this.config.url}?`, "D011");
            }
            if (error.code === 'ETIMEDOUT') {
                throw new ConnectionError(`Failed to connect to CouchDB: Connection timeout.`, "D010");
            }
            // If it's already a DataBridge error, re-throw it
            if (error instanceof DriverError || error instanceof ConnectionError || error instanceof SchemaError) {
                throw error;
            }
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