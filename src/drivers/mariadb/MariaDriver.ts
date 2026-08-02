import Driver from "../Driver";
import type { Config } from "../../types/config";
import type { Query } from "../../types/query";
import mariaDB, { Connection } from "mariadb";
import { DriverError, ConnectionError } from "../../exceptions";
import MariaQuery from "./MariaQuery";

export class MariaDriver extends Driver {
    private connection: Connection | null = null;

    constructor(config: Config) {
        super(config);
    }

    public async connect(): Promise<void> {
        if (!this.config.user) {
            throw new DriverError("Database user is missing or empty", "D024");
        }

        if (!this.config.password) {
            throw new DriverError("Database password is missing or empty", "D025");
        }

        if (!this.config.database) {
            throw new DriverError("Database name is missing or empty", "D026");
        }

        try {
            this.connection = await mariaDB.createConnection({
                host: this.config.host ?? "localhost",
                user: this.config.user,
                password: this.config.password,
                database: this.config.database,
            });

            await this.connection.execute("select 1");
        } catch (error: any) {
            // ER_BAD_DB_ERROR = Unknown database
            if (error?.code === "ER_BAD_DB_ERROR") {
                const adminConnection = await mariaDB.createConnection({
                    host: this.config.host ?? "localhost",
                    user: this.config.user,
                    password: this.config.password,
                });

                try {
                    await adminConnection.query(`create database "${this.config.database}"`);
                } finally {
                    await adminConnection.end();
                }

                this.connection = await mariaDB.createConnection({
                    host: this.config.host ?? "localhost",
                    user: this.config.user,
                    password: this.config.password,
                    database: this.config.database,
                });

                await this.connection.execute("SELECT 1");
                return;
            }

            throw new ConnectionError(`Failed to connect to MariaDB: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    public async query(query: Query): Promise<any> {
        if (!this.connection) {
            throw new ConnectionError("Not connected to database", "D015");
        }

        return await new MariaQuery(query, this.connection).run();
    }
}