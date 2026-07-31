import Driver from "../Driver";
import type { Config } from "../../types/config";
import sqlite3, { Database } from "sqlite3";
import { DriverError, ConnectionError } from "../../exceptions";

export class SQLiteDriver extends Driver {
    private db: Database | null = null;

    constructor(config: Config) {
        super(config);
    }

    public async connect(): Promise<void> {
        if (!this.config.database) {
            throw new DriverError("SQLite database file is missing or empty","D024");
        }

        try {
            this.db = await new Promise<Database>((resolve, reject) => {
                const database = new sqlite3.Database(
                    this.config.database!,
                    (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(database);
                        }
                    }
                );
            });
        }
        catch (error) {
            throw new ConnectionError(`Failed to connect to SQLite: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.db) {
            return;
        }

        await new Promise<void>((resolve, reject) => {
            this.db!.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        this.db = null;
    }

    public async query(data: unknown): Promise<any> {
        if (!this.db) {
            throw new ConnectionError("Not connected to database","D015");
        }

        // return new Promise((resolve, reject) => {
        //     this.db!.all(sql, (err, rows) => {
        //         if (err) {
        //             reject(
        //                 new ConnectionError(`SQLite query failed: ${err.message}`)
        //             );
        //         } else {
        //             resolve(rows);
        //         }
        //     });
        // });
    }
}