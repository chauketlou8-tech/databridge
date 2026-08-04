import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getSqliteType } from "./Types";

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

                            const sql = `insert into ${this.tableName} (${cols}) values (${placeholders})`;

                            await new Promise<void>((resolve, reject) => {
                                this.connection.run(sql, Object.values(row), (err: any) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                            break;
                    }
                    break;

                case "find":
                    try {
                        // Check if table exists
                        const tableCheck = await new Promise<any>((resolve, reject) => {
                            this.connection.all(
                                `select name from sqlite_master where type='table' and name=?`,
                                [this.tableName],
                                (err: any, rows: any) => {
                                    if (err) reject(err);
                                    else resolve(rows);
                                }
                            );
                        });

                        if (!tableCheck || tableCheck.length === 0) {
                            throw new SchemaError(`Table "${this.tableName}" does not exist`, "D044");
                        }

                        if (!this.data?.where || Object.keys(this.data.where).length === 0) {
                            return await new Promise<any>((resolve, reject) => {
                                this.connection.all(
                                    `select * from ${this.tableName}`,
                                    (err: any, rows: any) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    }
                                );
                            });
                        }

                        // @ts-ignore
                        if (this.data.where.or && Array.isArray(this.data.where.or)) {
                            // @ts-ignore
                            const orConditions = this.data.where.or;
                            let whereClauses: string[] = [];
                            let values: any[] = [];

                            for (const condition of orConditions) {
                                for (const [key, value] of Object.entries(condition)) {
                                    whereClauses.push(`"${key}" = ?`);
                                    values.push(value);
                                }
                            }

                            return await new Promise<any>((resolve, reject) => {
                                this.connection.all(
                                    `select * from ${this.tableName} where ${whereClauses.join(' or ')}`,
                                    values,
                                    (err: any, rows: any) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    }
                                );
                            });
                        }

                        // Handle top-level not operator
                        // @ts-ignore
                        if (this.data.where.not && typeof this.data.where.not === "object") {
                            // @ts-ignore
                            const notConditions = this.data.where.not;
                            let whereClauses: string[] = [];
                            let values: any[] = [];

                            for (const [key, value] of Object.entries(notConditions)) {
                                whereClauses.push(`"${key}" != ?`);
                                values.push(value);
                            }

                            return await new Promise<any>((resolve, reject) => {
                                this.connection.all(
                                    `select * from ${this.tableName} where ${whereClauses.join(' and ')}`,
                                    values,
                                    (err: any, rows: any) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    }
                                );
                            });
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
                                // Handle regex operator - convert regex to SQLite LIKE pattern
                                if (value.regex !== undefined) {
                                    const likePattern = this.regexToLike(value.regex);
                                    whereClauses.push(`"${key}" LIKE ?`);
                                    values.push(likePattern);
                                    continue;
                                }

                                // Handle startsWith
                                if (value.startsWith !== undefined) {
                                    whereClauses.push(`"${key}" LIKE ?`);
                                    values.push(`${value.startsWith}%`);
                                    continue;
                                }

                                // Handle endsWith
                                if (value.endsWith !== undefined) {
                                    whereClauses.push(`"${key}" LIKE ?`);
                                    values.push(`%${value.endsWith}`);
                                    continue;
                                }

                                // Handle contains
                                if (value.contains !== undefined) {
                                    whereClauses.push(`"${key}" LIKE ?`);
                                    values.push(`%${value.contains}%`);
                                    continue;
                                }

                                // Handle nthContain - specific position
                                if (value.nthContain && typeof value.nthContain === "object") {
                                    const nthConditions = value.nthContain;
                                    for (const [position, positionValue] of Object.entries(nthConditions)) {
                                        let pos: number;
                                        const posMap: Record<string, number> = {
                                            "first": 1,
                                            "second": 2,
                                            "third": 3,
                                            "fourth": 4,
                                            "fifth": 5
                                        };

                                        if (typeof position === "string" && posMap[position]) {
                                            pos = posMap[position];
                                        } else {
                                            pos = parseInt(position);
                                        }

                                        if (isNaN(pos) || pos < 1) {
                                            throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
                                        }

                                        if (Array.isArray(positionValue) && positionValue.length > 0) {
                                            const orClauses: string[] = [];
                                            for (const val of positionValue) {
                                                const prefix = "_".repeat(pos - 1);
                                                orClauses.push(`"${key}" LIKE ?`);
                                                values.push(`${prefix}${val}%`);
                                            }
                                            whereClauses.push(`(${orClauses.join(' or ')})`);
                                        } else if (typeof positionValue === "string") {
                                            const prefix = "_".repeat(pos - 1);
                                            whereClauses.push(`"${key}" LIKE ?`);
                                            values.push(`${prefix}${positionValue}%`);
                                        } else {
                                            throw new QueryError(`Invalid value for nthContain at position "${position}"`, "D036");
                                        }
                                    }
                                    continue;
                                }

                                // Handle between operator
                                if (value.between && Array.isArray(value.between) && value.between.length === 2) {
                                    whereClauses.push(`"${key}" BETWEEN ? AND ?`);
                                    values.push(value.between[0]);
                                    values.push(value.between[1]);
                                    continue;
                                }

                                // Handle in operator
                                if (value.in && Array.isArray(value.in) && value.in.length > 0) {
                                    const placeholders = value.in.map(() => "?").join(", ");
                                    whereClauses.push(`"${key}" IN (${placeholders})`);
                                    values.push(...value.in);
                                    continue;
                                }

                                // Handle nested not operator
                                if (value.not !== undefined) {
                                    whereClauses.push(`"${key}" != ?`);
                                    values.push(value.not);
                                    continue;
                                }

                                // Handle regular operators
                                for (const [operator, opValue] of Object.entries(value)) {
                                    switch (operator) {
                                        case "gte":
                                            whereClauses.push(`"${key}" >= ?`);
                                            values.push(opValue);
                                            break;
                                        case "gt":
                                            whereClauses.push(`"${key}" > ?`);
                                            values.push(opValue);
                                            break;
                                        case "lte":
                                            whereClauses.push(`"${key}" <= ?`);
                                            values.push(opValue);
                                            break;
                                        case "lt":
                                            whereClauses.push(`"${key}" < ?`);
                                            values.push(opValue);
                                            break;
                                        case "ne":
                                            whereClauses.push(`"${key}" != ?`);
                                            values.push(opValue);
                                            break;
                                        default:
                                            whereClauses.push(`"${key}" = ?`);
                                            values.push(opValue);
                                    }
                                }
                            } else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                                // Handle string values that look like regex patterns
                                const likePattern = this.regexToLike(value);
                                whereClauses.push(`"${key}" LIKE ?`);
                                values.push(likePattern);
                            } else {
                                whereClauses.push(`"${key}" = ?`);
                                values.push(value);
                            }
                        }

                        if (whereClauses.length > 0) {
                            return await new Promise<any>((resolve, reject) => {
                                this.connection.all(
                                    `select * from ${this.tableName} where ${whereClauses.join(' and ')}`,
                                    values,
                                    (err: any, rows: any) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    }
                                );
                            });
                        }

                        // If no where clauses, return all
                        return await new Promise<any>((resolve, reject) => {
                            this.connection.all(
                                `select * from ${this.tableName}`,
                                (err: any, rows: any) => {
                                    if (err) reject(err);
                                    else resolve(rows);
                                }
                            );
                        });

                    } catch (error) {
                        if (error instanceof SchemaError) {
                            throw error;
                        }
                        throw new QueryError(`Failed to query table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
                    }

                case "findOne":
                    try {
                        // Check if table exists
                        const tableCheck = await new Promise<any>((resolve, reject) => {
                            this.connection.all(
                                `select name from sqlite_master where type='table' and name=?`,
                                [this.tableName],
                                (err: any, rows: any) => {
                                    if (err) reject(err);
                                    else resolve(rows);
                                }
                            );
                        });

                        if (!tableCheck || tableCheck.length === 0) {
                            throw new SchemaError(`Table "${this.tableName}" does not exist`, "D044");
                        }

                        let sql = `select * from ${this.tableName}`;
                        let values: any[] = [];

                        if (this.data?.where && Object.keys(this.data.where).length > 0) {
                            const whereClauses: string[] = [];

                            // @ts-ignore
                            if (this.data.where.or && Array.isArray(this.data.where.or)) {
                                // @ts-ignore
                                const orConditions = this.data.where.or;
                                for (const condition of orConditions) {
                                    for (const [key, val] of Object.entries(condition)) {
                                        whereClauses.push(`"${key}" = ?`);
                                        values.push(val);
                                    }
                                }
                                sql += ` where ${whereClauses.join(' or ')}`;
                            }
                                // Handle top-level not operator
                            // @ts-ignore
                            else if (this.data.where.not && typeof this.data.where.not === "object") {
                                // @ts-ignore
                                const notConditions = this.data.where.not;
                                for (const [key, val] of Object.entries(notConditions)) {
                                    whereClauses.push(`"${key}" != ?`);
                                    values.push(val);
                                }
                                sql += ` where ${whereClauses.join(' and ')}`;
                            }
                            // Handle regular where clause with nested operators
                            else {
                                const lookUps = Object.entries(this.data!.where);
                                for (const [key, value] of lookUps) {
                                    // Skip top-level special operators
                                    if (key === 'or' || key === 'not' || key === 'between' || key === 'in') {
                                        continue;
                                    }

                                    if (typeof value === "object" && value !== null) {
                                        // Handle regex operator
                                        if (value.regex !== undefined) {
                                            const likePattern = this.regexToLike(value.regex);
                                            whereClauses.push(`"${key}" LIKE ?`);
                                            values.push(likePattern);
                                            continue;
                                        }

                                        // Handle startsWith
                                        if (value.startsWith !== undefined) {
                                            whereClauses.push(`"${key}" LIKE ?`);
                                            values.push(`${value.startsWith}%`);
                                            continue;
                                        }

                                        // Handle endsWith
                                        if (value.endsWith !== undefined) {
                                            whereClauses.push(`"${key}" LIKE ?`);
                                            values.push(`%${value.endsWith}`);
                                            continue;
                                        }

                                        // Handle contains
                                        if (value.contains !== undefined) {
                                            whereClauses.push(`"${key}" LIKE ?`);
                                            values.push(`%${value.contains}%`);
                                            continue;
                                        }

                                        // Handle nthContain
                                        if (value.nthContain && typeof value.nthContain === "object") {
                                            const nthConditions = value.nthContain;
                                            for (const [position, positionValue] of Object.entries(nthConditions)) {
                                                let pos: number;
                                                const posMap: Record<string, number> = {
                                                    "first": 1,
                                                    "second": 2,
                                                    "third": 3,
                                                    "fourth": 4,
                                                    "fifth": 5
                                                };

                                                if (typeof position === "string" && posMap[position]) {
                                                    pos = posMap[position];
                                                } else {
                                                    pos = parseInt(position);
                                                }

                                                if (isNaN(pos) || pos < 1) {
                                                    throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
                                                }

                                                if (Array.isArray(positionValue) && positionValue.length > 0) {
                                                    const orClauses: string[] = [];
                                                    for (const val of positionValue) {
                                                        const prefix = "_".repeat(pos - 1);
                                                        orClauses.push(`"${key}" LIKE ?`);
                                                        values.push(`${prefix}${val}%`);
                                                    }
                                                    whereClauses.push(`(${orClauses.join(' or ')})`);
                                                } else if (typeof positionValue === "string") {
                                                    const prefix = "_".repeat(pos - 1);
                                                    whereClauses.push(`"${key}" LIKE ?`);
                                                    values.push(`${prefix}${positionValue}%`);
                                                } else {
                                                    throw new QueryError(`Invalid value for nthContain at position "${position}"`, "D036");
                                                }
                                            }
                                            continue;
                                        }

                                        // Handle between operator
                                        if (value.between && Array.isArray(value.between) && value.between.length === 2) {
                                            whereClauses.push(`"${key}" BETWEEN ? AND ?`);
                                            values.push(value.between[0]);
                                            values.push(value.between[1]);
                                            continue;
                                        }

                                        // Handle in operator
                                        if (value.in && Array.isArray(value.in) && value.in.length > 0) {
                                            const placeholders = value.in.map(() => "?").join(", ");
                                            whereClauses.push(`"${key}" IN (${placeholders})`);
                                            values.push(...value.in);
                                            continue;
                                        }

                                        // Handle nested not operator
                                        if (value.not !== undefined) {
                                            whereClauses.push(`"${key}" != ?`);
                                            values.push(value.not);
                                            continue;
                                        }

                                        // Handle regular operators
                                        for (const [operator, opValue] of Object.entries(value)) {
                                            switch (operator) {
                                                case "gte":
                                                    whereClauses.push(`"${key}" >= ?`);
                                                    values.push(opValue);
                                                    break;
                                                case "gt":
                                                    whereClauses.push(`"${key}" > ?`);
                                                    values.push(opValue);
                                                    break;
                                                case "lte":
                                                    whereClauses.push(`"${key}" <= ?`);
                                                    values.push(opValue);
                                                    break;
                                                case "lt":
                                                    whereClauses.push(`"${key}" < ?`);
                                                    values.push(opValue);
                                                    break;
                                                case "ne":
                                                    whereClauses.push(`"${key}" != ?`);
                                                    values.push(opValue);
                                                    break;
                                                default:
                                                    whereClauses.push(`"${key}" = ?`);
                                                    values.push(opValue);
                                            }
                                        }
                                    } else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                                        const likePattern = this.regexToLike(value);
                                        whereClauses.push(`"${key}" LIKE ?`);
                                        values.push(likePattern);
                                    } else {
                                        whereClauses.push(`"${key}" = ?`);
                                        values.push(value);
                                    }
                                }

                                if (whereClauses.length > 0) {
                                    sql += ` where ${whereClauses.join(' and ')}`;
                                }
                            }
                        }

                        sql += ` limit 1`;
                        const rows = await new Promise<any>((resolve, reject) => {
                            this.connection.all(sql, values, (err: any, rows: any) => {
                                if (err) reject(err);
                                else resolve(rows);
                            });
                        });
                        return rows && rows.length > 0 ? rows[0] : null;

                    } catch (error) {
                        if (error instanceof SchemaError) {
                            throw error;
                        }
                        throw new QueryError(`Failed to find one in table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
                    }

                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented", "D036"`);
            }
        } catch (error) {
            // Re-throw if it's already a DataBridge error
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }
            // Wrap unknown errors
            throw new QueryError(`SQLite query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private regexToLike(regex: string): string {
        if (/[()[\]{}|+?\\dwWsS]/.test(regex)) {
            throw new QueryError("Only ^, $, and .* are supported in SQLite regex searches.", "D036");
        }

        let like = regex;

        like = like.replace(/\.\*/g, "%");

        if (like.startsWith("^")) {
            like = like.slice(1);
        } else {
            like = "%" + like;
        }

        if (like.endsWith("$")) {
            like = like.slice(0, -1);
        } else {
            like = like + "%";
        }

        return like;
    }
}