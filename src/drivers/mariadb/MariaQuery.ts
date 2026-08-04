import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getMariaType } from "./Types";

/**
 * MariaDB query handler class
 * Translates DataBridge queries into MariaDB operations
 */
export default class MariaQuery extends BaseQuery {
    protected connection: any;
    private tableName: string;

    constructor(query: Query, connection: unknown) {
        super(query);
        this.connection = connection;
        this.tableName = "";
        this.fields = {};
    }

    /**
     * Map DataBridge type to MariaDB type
     */
    protected mapType(type: string): string {
        return getMariaType(type);
    }

    /**
     * Executes the query against MariaDB
     * @throws {QueryError} If operation fails
     */
    public async run(): Promise<any> {
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
                            const tables = await this.connection.query(`select table_name from information_schema.tables where table_schema = DATABASE() and table_name = ?`, [this.tableName]);
                            if (tables && tables.length > 0 && tables[0].TABLE_NAME) {
                                throw new SchemaError(`Table "${this.tableName}" already exists`, "D043");
                            }

                            // Build CREATE TABLE query
                            const columns = Object.entries(this.fields).map(([field, type]) => `${field} ${type}`).join(",\n  ");

                            const createTableSQL = `create table if not exists \`${this.tableName}\` (id int primary key auto_increment,${columns})`;

                            await this.connection.query(createTableSQL);
                            break;

                        case "object":
                            const row = this.data?.data as Record<string, unknown>;

                            const cols = Object.keys(row).map(col => `\`${col}\``).join(", ");
                            const placeholders = Object.keys(row).map(() => "?").join(", ");

                            const sql = `insert into \`${this.tableName}\` (${cols}) values (${placeholders})`;
                            await this.connection.query(sql, Object.values(row));
                            break;
                    }
                    break;

                case "find":
                    try {
                        // Check if table exists first
                        const tableCheck = await this.connection.query(`select table_name from information_schema.tables where table_schema = DATABASE() and table_name = ?`, [this.tableName]);
                        if (!tableCheck[0] || tableCheck[0].length === 0) {
                            throw new SchemaError(`Table "${this.tableName}" does not exist`, "D044");
                        }

                        if (!this.data?.where || Object.keys(this.data.where).length === 0) {
                            const sql = `select * from \`${this.tableName}\``;
                            return await this.connection.query(sql);
                        }

                        // @ts-ignore
                        if (this.data.where.or && Array.isArray(this.data.where.or)) {
                            // @ts-ignore
                            const orConditions = this.data.where.or;
                            let whereClauses: string[] = [];
                            let values: any[] = [];

                            for (const condition of orConditions) {
                                for (const [key, value] of Object.entries(condition)) {
                                    whereClauses.push(`\`${key}\` = ?`);
                                    values.push(value);
                                }
                            }

                            const sql = `select * from \`${this.tableName}\` where ${whereClauses.join(' or ')}`;
                            return await this.connection.query(sql, values);
                        }

                        // Handle top-level not operator
                        // @ts-ignore
                        if (this.data.where.not && typeof this.data.where.not === "object") {
                            // @ts-ignore
                            const notConditions = this.data.where.not;
                            let whereClauses: string[] = [];
                            let values: any[] = [];

                            for (const [key, value] of Object.entries(notConditions)) {
                                whereClauses.push(`\`${key}\` != ?`);
                                values.push(value);
                            }

                            const sql = `select * from \`${this.tableName}\` where ${whereClauses.join(' and ')}`;
                            return await this.connection.query(sql, values);
                        }

                        // Handle regular where clause with nested operators
                        const lookUps = Object.entries(this.data!.where);
                        let whereClauses: string[] = [];
                        let values: any[] = [];

                        for (const [key, value] of lookUps) {
                            // Skip top-level special operators that were already handled
                            if (key === 'or' || key === 'not' || key === 'between' || key === 'in') {
                                continue;
                            }

                            if (typeof value === "object" && value !== null) {
                                // Handle between operator
                                if (value.between && Array.isArray(value.between) && value.between.length === 2) {
                                    whereClauses.push(`\`${key}\` between ? and ?`);
                                    values.push(value.between[0]);
                                    values.push(value.between[1]);
                                    continue;
                                }

                                // Handle in operator
                                if (value.in && Array.isArray(value.in) && value.in.length > 0) {
                                    const placeholders = value.in.map(() => "?").join(", ");
                                    whereClauses.push(`\`${key}\` in (${placeholders})`);
                                    values.push(...value.in);
                                    continue;
                                }

                                // Handle nested not operator (not: value)
                                if (value.not !== undefined) {
                                    whereClauses.push(`\`${key}\` != ?`);
                                    values.push(value.not);
                                    continue;
                                }

                                // Handle regular operators
                                for (const [operator, opValue] of Object.entries(value)) {
                                    switch (operator) {
                                        case "gte":
                                            whereClauses.push(`\`${key}\` >= ?`);
                                            values.push(opValue);
                                            break;
                                        case "gt":
                                            whereClauses.push(`\`${key}\` > ?`);
                                            values.push(opValue);
                                            break;
                                        case "lte":
                                            whereClauses.push(`\`${key}\` <= ?`);
                                            values.push(opValue);
                                            break;
                                        case "lt":
                                            whereClauses.push(`\`${key}\` < ?`);
                                            values.push(opValue);
                                            break;
                                        case "ne":
                                            whereClauses.push(`\`${key}\` != ?`);
                                            values.push(opValue);
                                            break;
                                        default:
                                            whereClauses.push(`\`${key}\` = ?`);
                                            values.push(opValue);
                                    }
                                }
                            } else {
                                // Simple equality
                                whereClauses.push(`\`${key}\` = ?`);
                                values.push(value);
                            }
                        }

                        if (whereClauses.length > 0) {
                            const sql = `select * from \`${this.tableName}\` where ${whereClauses.join(' and ')}`;
                            return await this.connection.query(sql, values);
                        }

                        // If no where clauses, return all
                        const sql = `select * from \`${this.tableName}\``;
                        return await this.connection.query(sql);

                    } catch (error) {
                        if (error instanceof SchemaError) {
                            throw error;
                        }
                        throw new QueryError(`Failed to query table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
                    }

                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            // Re-throw if it's already a DataBridge error
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }
            // Wrap unknown errors
            throw new QueryError(`MariaDB query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}