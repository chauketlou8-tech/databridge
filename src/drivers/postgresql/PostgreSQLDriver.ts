import Driver from "../Driver"
import type { Config } from "../../types/config";
import { DriverError, ConnectionError } from "../../exceptions"

import { Pool } from 'pg';

export class PostgreSQLDriver extends Driver {
    private pool: Pool | undefined;

    constructor(config: Config) {
        super(config);
    }

    public async connect(): Promise<void> {
        if (!this.config.url) {
            throw new DriverError("The connection URL is missing or empty", "D024");
        }

        try {
            const pool = new Pool({
                connectionString: this.config.url,
                host: this.config.host ?? "localhost"
            });

            // Extract database name from URL
            // postgresql://user:password@localhost:5432/database
            const match = this.config.url.match(/^postgres(?:ql)?:\/\/[^\/]+\/([^?]+)/);

            if (match && match[1]) {
                const dbName = match[1];
                await pool.query(`create database ${dbName}`);
            }

            this.pool = pool;
        }
        catch (error) {
            //console.log("Actual error:", error);
            throw new ConnectionError(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        await this.pool?.end();
        console.log("disconnected...");
    }
}