import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getPostgresType } from "./Types";
import { Schema } from "../../schema";

/**
 * PostgreSQL query handler class
 * Translates DataBridge queries into PostgreSQL operations
 */
export default class PostgresQuery extends BaseQuery {
    protected connection: any;
    private tableName: string;

    constructor(query: Query, pool: unknown) {
        super(query);
        this.connection = pool;
        this.tableName = "";
        this.fields = {};
    }

    /**
     * Map DataBridge type to PostgreSQL type
     */
    protected mapType(type: string): string {
        return getPostgresType(type);
    }

    /**
     * Executes the query against PostgreSQL
     * @throws {QueryError} If operation fails
     */
    public async run(): Promise<void> {
        try {
            await this.read();

            const VALID_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

            if (!VALID_IDENTIFIER.test(this.data!.name as string)) {
                throw new ModelError("Invalid model name", "D056");
            }

            this.tableName = (this.data!.name as string);

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            this.readSchema();

                            // Check if table already exists
                            const tables = await this.connection.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`, [this.tableName]);
                            if (tables.rows && tables.rows.length > 0) {
                                throw new SchemaError(`Table "${this.tableName}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n");

                            const createTableSQL = `create table if not exists "${this.tableName}" (id serial primary key, ${columns})`;

                            await this.connection.query(createTableSQL);
                            break;

                        case "object":
                            const row = this.data?.data as Record<string, unknown>;

                            const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(", ");
                            const cols = Object.keys(row).map(col => `"${col}"`).join(", ");

                            const sql = `insert into "${this.tableName}" (${cols}) values (${placeholders})`;
                            await this.connection.query(sql, Object.values(row));
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
            throw new QueryError(`PostgreSQL query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
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