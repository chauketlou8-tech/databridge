import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getSqliteType } from "./Types";

/**
 * SQLite query handler class
 * Translates DataBridge queries into SQLite operations
 */
export default class SqliteQuery extends BaseQuery {
    protected connection: any;

    constructor(query: Query, db: unknown) {
        super(query);
        this.connection = db;
        this.fields = {};
    }

    /**
     * Map DataBridge type to SQLite type
     */
    protected mapType(type: string): string {
        return getSqliteType(type);
    }

    /**
     * Executes the query against SQLite
     * @throws {QueryError} If operation fails
     */
    public async run(): Promise<void> {
        try {
            await this.read();

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            // Check if table already exists
                            const tables = await new Promise<any>((resolve, reject) => {
                                this.connection.all(
                                    `select name from sqlite_master where type='table' and name=?`,
                                    [this.data?.name],
                                    (err: any, rows: any) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    }
                                );
                            });

                            if (tables && tables.length > 0) {
                                throw new SchemaError(`Table "${this.data?.name}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n  ");

                            const createTableSQL = `create table if not exists ${this.data?.name} (id integer primary key autoincrement, ${columns})`;

                            await new Promise<void>((resolve, reject) => {
                                this.connection.run(createTableSQL, (err: any) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            break;
                    }
                    break;
                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            // Re-throw if it's already a DataBridge error
            if (error instanceof QueryError || error instanceof SchemaError) {
                throw error;
            }
            // Wrap unknown errors
            throw new QueryError(`SQLite query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}