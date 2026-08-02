import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getMysqlType } from "./Types";
import { Schema } from "../../schema";

/**
 * MySQL query handler class
 * Translates DataBridge queries into MySQL operations
 */
export default class MysqlQuery extends BaseQuery {
    protected connection: any;
    private tableName: string;

    constructor(query: Query, connection: unknown) {
        super(query);
        this.connection = connection;
        this.tableName = "";
        this.fields = {};
    }

    /**
     * Map DataBridge type to MySQL type
     */
    protected mapType(type: string): string {
        return getMysqlType(type);
    }

    /**
     * Executes the query against MySQL
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
                            const [tables] = await this.connection.query(`select table_name from information_schema.tables where table_schema = DATABASE() and table_name = ?`, [this.tableName]);

                            if (tables && tables.length > 0) {
                                throw new SchemaError(`Table "${this.tableName}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n  ");

                            const createTableSQL = `create table if not exists ${this.tableName} (id int primary key auto_increment,${columns})`;

                            await this.connection.query(createTableSQL);
                            break;

                        case "object":
                            const row = this.data?.data as Record<string, unknown>;

                            const cols = Object.keys(row).map(col => `"${col}"`).join(", ");
                            const placeholders = Object.keys(row).map(() => "?").join(", ");

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
            throw new QueryError(`MySQL query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
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