import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import { ModelError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getPostgresType } from "./Types";

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
     * @throws {ModelError} for invalid model names
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

                case "find":
                    try {
                        // Check if table exists first
                        const tableCheck = await this.connection.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`, [this.tableName]);

                        if (!tableCheck.rows || tableCheck.rows.length === 0) {
                            throw new SchemaError(`Table "${this.tableName}" does not exist`, "D044");
                        }

                        if (!this.data?.where || Object.keys(this.data.where).length === 0) {
                            const sql = `select * from "${this.tableName}"`;
                            const result = await this.connection.query(sql);
                            return result.rows;
                        }

                        // Handle $or operator
                        // @ts-ignore
                        if (this.data.where.or && Array.isArray(this.data.where.or)) {
                            // @ts-ignore
                            const orConditions = this.data.where.or;
                            const orClauses: string[] = [];
                            const orValues: any[] = [];
                            let paramIndex = 1;

                            for (const condition of orConditions) {
                                for (const [key, value] of Object.entries(condition)) {
                                    orClauses.push(`"${key}" = $${paramIndex}`);
                                    orValues.push(value);
                                    paramIndex++;
                                }
                            }

                            const sql = `select * from "${this.tableName}" where ${orClauses.join(' or ')}`;
                            const result = await this.connection.query(sql, orValues);
                            return result.rows;
                        }

                        // Handle top-level not operator
                        // @ts-ignore
                        if (this.data.where.not && typeof this.data.where.not === "object") {
                            // @ts-ignore
                            const notConditions = this.data.where.not;
                            const notClauses: string[] = [];
                            const notValues: any[] = [];
                            let paramIndex = 1;

                            for (const [key, value] of Object.entries(notConditions)) {
                                notClauses.push(`"${key}" != $${paramIndex}`);
                                notValues.push(value);
                                paramIndex++;
                            }

                            const sql = `select * from "${this.tableName}" where ${notClauses.join(' and ')}`;
                            const result = await this.connection.query(sql, notValues);
                            return result.rows;
                        }

                        // Handle regular where clause with nested operators
                        const lookUps = Object.entries(this.data!.where);
                        let whereClauses: string[] = [];
                        let values: any[] = [];
                        let paramIndex = 1;

                        for (const [key, value] of lookUps) {
                            // Skip top-level special operators that were already handled
                            if (key === 'or' || key === 'not' || key === 'between' || key === 'in') {
                                continue;
                            }

                            if (typeof value === "object" && value !== null) {
                                // Handle between operator
                                if (value.between && Array.isArray(value.between) && value.between.length === 2) {
                                    whereClauses.push(`"${key}"between $${paramIndex} and $${paramIndex + 1}`);
                                    values.push(value.between[0]);
                                    values.push(value.between[1]);
                                    paramIndex += 2;
                                    continue;
                                }

                                // Handle in operator
                                if (value.in && Array.isArray(value.in) && value.in.length > 0) {
                                    const placeholders = value.in.map((_: any, index: number) => `$${paramIndex + index}`).join(", ");
                                    whereClauses.push(`"${key}" in (${placeholders})`);
                                    values.push(...value.in);
                                    paramIndex += value.in.length;
                                    continue;
                                }

                                // Handle nested not operator
                                if (value.not !== undefined) {
                                    whereClauses.push(`"${key}" != $${paramIndex}`);
                                    values.push(value.not);
                                    paramIndex++;
                                    continue;
                                }

                                // Handle regular operators
                                for (const [operator, opValue] of Object.entries(value)) {
                                    switch (operator) {
                                        case "gte":
                                            whereClauses.push(`"${key}" >= $${paramIndex}`);
                                            values.push(opValue);
                                            paramIndex++;
                                            break;
                                        case "gt":
                                            whereClauses.push(`"${key}" > $${paramIndex}`);
                                            values.push(opValue);
                                            paramIndex++;
                                            break;
                                        case "lte":
                                            whereClauses.push(`"${key}" <= $${paramIndex}`);
                                            values.push(opValue);
                                            paramIndex++;
                                            break;
                                        case "lt":
                                            whereClauses.push(`"${key}" < $${paramIndex}`);
                                            values.push(opValue);
                                            paramIndex++;
                                            break;
                                        case "ne":
                                            whereClauses.push(`"${key}" != $${paramIndex}`);
                                            values.push(opValue);
                                            paramIndex++;
                                            break;
                                        default:
                                            whereClauses.push(`"${key}" = $${paramIndex}`);
                                            values.push(opValue);
                                            paramIndex++;
                                    }
                                }
                            } else {
                                whereClauses.push(`"${key}" = $${paramIndex}`);
                                values.push(value);
                                paramIndex++;
                            }
                        }

                        if (whereClauses.length > 0) {
                            const sql = `select * from "${this.tableName}" where ${whereClauses.join(' and ')}`;
                            const result = await this.connection.query(sql, values);
                            return result.rows;
                        }

                        // If no where clauses, return all
                        const sql = `select * from "${this.tableName}"`;
                        const result = await this.connection.query(sql);
                        return result.rows;

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
            throw new QueryError(`PostgreSQL query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}