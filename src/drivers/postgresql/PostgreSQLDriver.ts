import Driver from "../Driver"
import type { Config } from "../../types/config";
import { DriverError, ConnectionError } from "../../exceptions"

import { Pool } from 'pg';

export class PostgreSQLDriver extends Driver {
    private pool: Pool | undefined;

    constructor(config: Config) {
        super(config);
        this.pool = new Pool({
            connectionString: this.config.url,
            host: this.config.host ?? "localhost"
        });
    }

    public async connect(): Promise<void> {
        if (!this.config.url) {
            throw new DriverError("The connection URL is missing or empty", "D024");
        }

        try {
            // Test connection
            await this.pool?.query("select 1");
        }
        catch (error) {
            await this.pool?.end();

            const match = this.config.url.match(/^postgres(?:ql)?:\/\/[^\/]+\/([^?]+)/);

            if (match && match[1] && error && typeof error === "object" && "code" in error && error.code === "3D000") {
                const dbName = match[1];

                const adminUrl = this.config.url.replace(/\/([^/?]+)(\?.*)?$/,"/postgres$2");

                const adminPool = new Pool({
                    connectionString: adminUrl,
                    host: this.config.host ?? "localhost"
                });

                try {
                    await adminPool.query(`create database "${dbName}"`);
                } finally {
                    await adminPool.end();
                }

                this.pool = new Pool({
                    connectionString: this.config.url,
                    host: this.config.host ?? "localhost"
                });

                // Test connection again
                await this.pool?.query("select 1");
                return;
            }

            throw new ConnectionError(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        await this.pool?.end();
        console.log("disconnected...");
    }

    public async query(sql: string): Promise<any> {
        if (!this.pool) {
            throw new ConnectionError("Not connected to database", "D015");
        }
        return await this.pool.query(sql);
    }
}