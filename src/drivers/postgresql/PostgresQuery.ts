import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getPostgresType } from "./Types";

/**
 * PostgreSQL query handler class
 * Translates DataBridge queries into PostgreSQL operations
 */
export default class PostgresQuery extends BaseQuery {
    protected connection: any;

    constructor(query: Query, pool: unknown) {
        super(query);
        this.connection = pool;
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

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            // Check if table already exists
                            const tables = await this.connection.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`, [this.data?.name]);

                            if (tables.rows && tables.rows.length > 0) {
                                throw new SchemaError(`Table "${this.data?.name}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n  ");

                            const createTableSQL = `create table if not exists ${this.data?.name} (id serial primary key, ${columns})`;

                            await this.connection.query(createTableSQL);
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
}