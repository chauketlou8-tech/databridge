import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getMysqlType } from "./Types";

/**
 * MySQL query handler class
 * Translates DataBridge queries into MySQL operations
 */
export default class MysqlQuery extends BaseQuery {
    protected connection: any;

    constructor(query: Query, connection: unknown) {
        super(query);
        this.connection = connection;
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

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            // Check if table already exists
                            const [tables] = await this.connection.query(`select table_name from information_schema.tables where table_schema = DATABASE() and table_name = ?`, [this.data?.name]);

                            if (tables && tables.length > 0) {
                                throw new SchemaError(`Table "${this.data?.name}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n  ");

                            const createTableSQL = `create table if not exists ${this.data?.name} (id int primary key auto_increment,${columns})`;

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
            throw new QueryError(`MySQL query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}