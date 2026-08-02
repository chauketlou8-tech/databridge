import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getSqliteType } from "./Types";
import { Schema } from "../../schema";

/**
 * SQLite query handler class
 * Translates DataBridge queries into SQLite operations
 */
export default class SqliteQuery extends BaseQuery {
    protected connection: any;
    private tableName: string;

    constructor(query: Query, db: unknown) {
        super(query);
        this.connection = db;
        this.tableName = "";
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

            this.tableName = this.data?.name as string;

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            this.readSchema();

                            // Check if table already exists
                            const tables = await new Promise<any>((resolve, reject) => {
                                this.connection.all(
                                    `select name from sqlite_master where type='table' and name=?`,
                                    [this.tableName],
                                    (err: any, rows: any) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    }
                                );
                            });

                            if (tables && tables.length > 0) {
                                throw new SchemaError(`Table "${this.tableName}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n  ");

                            const createTableSQL = `create table if not exists ${this.tableName} (id integer primary key autoincrement, ${columns})`;

                            await new Promise<void>((resolve, reject) => {
                                this.connection.run(createTableSQL, (err: any) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            break;

                        case "object":
                            const row = this.data?.data as Record<string, unknown>;

                            const cols = Object.keys(row).map(col => `"${col}"`).join(", ");
                            const placeholders = Object.keys(row).map(() => "?").join(", ");

                            const sql = `insert into "${this.tableName}" (${cols}) values (${placeholders})`;

                            await new Promise<void>((resolve, reject) => {
                                this.connection.run(sql, Object.values(row), (err: any) => {
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

    private readSchema() {
        // Validate schema
        if (!this.query.data?.hasOwnProperty("Schema") || !(this.query.data["Schema"] instanceof Schema)) {
            throw new SchemaError("The schema definition is invalid or malformed", "D040");
        }

        // Build database schema from DataBridge schema
        const schema = this.query.data["Schema"] as Schema;

        for (const field of schema.fields) {
            this.fields[field.field] = this.mapType(field.type);
        }
    }
}