import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getSqliteType } from "./Types";
import type { Model } from "../../model";

/**
 * SQLite query handler class
 * Translates DataBridge queries into SQLite operations
 */
export default class SqliteQuery extends BaseQuery {
    protected connection: any;
    protected tableName: string;
    private model: Model | null;

    constructor(query: Query, db: unknown, model: Model | null = null) {
        super(query);
        this.connection = db;
        this.tableName = "";
        this.model = model;
        this.fields = {};
    }

    protected mapType(type: string): string {
        return getSqliteType(type);
    }

    public async run(): Promise<any> {
        try {
            this.read();
            this.validateModelName();
            this.tableName = this.getTableName();

            switch (this.operation) {
                case "create":
                    return await this.handleCreate();
                case "find":
                    return await this.handleFind();
                case "findOne":
                    return await this.handleFindOne();
                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }
            throw new QueryError(`SQLite query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private async handleCreate(): Promise<any> {
        switch (this.query.type) {
            case "model":
                return await this.handleCreateModel();
            case "object":
                return await this.handleCreateObject();
            default:
                throw new QueryError(`Create type "${this.query.type}" not implemented`, "D036");
        }
    }

    private async handleCreateModel(): Promise<void> {
        this.readSchema();

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

        const columns = Object.entries(this.fields)
            .map(([field, type]) => `"${field}" ${type}`)
            .join(",");

        const createTableSQL = `create table if not exists "${this.tableName}" (id integer primary key autoincrement, ${columns})`;

        await new Promise<void>((resolve, reject) => {
            this.connection.run(createTableSQL, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private async handleCreateObject(): Promise<void> {
        const row = this.data!.data as Record<string, unknown>;
        const processedRow = this.processRowData(row, this.model);

        const cols = Object.keys(processedRow).map(col => `"${col}"`).join(", ");
        const placeholders = Object.keys(processedRow).map(() => "?").join(", ");

        const sql = `insert into "${this.tableName}" (${cols}) values (${placeholders})`;

        await new Promise<void>((resolve, reject) => {
            this.connection.run(sql, Object.values(processedRow), (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private async handleFind(): Promise<any[]> {
        try {
            await this.ensureTableExists();

            const where = this.getWhere();
            if (!where || Object.keys(where).length === 0) {
                const result = await this.executeQuery(`select * from "${this.tableName}"`);
                return this.sterilizeResult(result, this.model);
            }

            const topLevelResult = await this.handleTopLevelOperators(false);
            if (topLevelResult !== null) {
                return this.sterilizeResult(topLevelResult, this.model);
            }

            const { sql, values } = this.buildWhereClause();
            const fullSql = sql ? `select * from "${this.tableName}" where ${sql}` : `select * from "${this.tableName}"`;
            const result = await this.executeQuery(fullSql, values);
            return this.sterilizeResult(result || [], this.model);

        } catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }
            throw new QueryError(`Failed to query table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private async handleFindOne(): Promise<any | null> {
        try {
            await this.ensureTableExists();

            let sql = `select * from "${this.tableName}"`;
            let values: any[] = [];

            const where = this.getWhere();
            if (where && Object.keys(where).length > 0) {
                const topLevelResult = await this.handleTopLevelOperators(true);
                if (topLevelResult !== null) {
                    return this.sterilizeResult(topLevelResult, this.model);
                }

                const result = this.buildWhereClause();
                if (result.sql) {
                    sql += ` where ${result.sql}`;
                    values = result.values;
                }
            }

            sql += ` limit 1`;
            const result = await this.executeQuery(sql, values);
            return this.sterilizeResult(result[0] ?? null, this.model);

        } catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }
            throw new QueryError(`Failed to find one in table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private async ensureTableExists(): Promise<void> {
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
    }

    private async executeQuery(sql: string, values: any[] = []): Promise<any> {
        return await new Promise<any>((resolve, reject) => {
            this.connection.all(sql, values, (err: any, rows: any) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    private async handleTopLevelOperators(isFindOne: boolean): Promise<any | null> {
        const where = this.getWhere();
        if (!where || Object.keys(where).length === 0) return null;

        if (where.expr && typeof where.expr === "object") {
            const exprSQL = this.buildExprSQL(where.expr);
            const sql = `select * from "${this.tableName}" where ${exprSQL.sql}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, exprSQL.values);
            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        if (where.or && Array.isArray(where.or)) {
            const whereClauses: string[] = [];
            const values: any[] = [];

            for (const condition of where.or) {
                for (const [key, value] of Object.entries(condition)) {
                    whereClauses.push(`"${key}" = ?`);
                    values.push(value);
                }
            }

            const sql = `select * from "${this.tableName}" where ${whereClauses.join(' or ')}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, values);
            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        if (where.not && typeof where.not === "object") {
            const notConditions = where.not;
            const whereClauses: string[] = [];
            const values: any[] = [];

            for (const [key, value] of Object.entries(notConditions)) {
                whereClauses.push(`"${key}" != ?`);
                values.push(value);
            }

            const sql = `select * from "${this.tableName}" where ${whereClauses.join(' and ')}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, values);
            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        if (where.exists && typeof where.exists === "object" && !Array.isArray(where.exists)) {
            if (where.exists.relation && where.exists.where) {
                const relation = where.exists.relation;
                const whereClause = where.exists.where;
                const subWhere = Object.entries(whereClause)
                    .map(([key, value]) => `"${key}" = "${value}"`)
                    .join(' AND ');
                const sql = `select * from "${this.tableName}" where exists (select 1 from "${relation}" where ${subWhere})${isFindOne ? ' limit 1' : ''}`;
                const result = await this.executeQuery(sql);
                return isFindOne ? (result[0] ?? null) : (result || []);
            }
        }

        return null;
    }

    private buildWhereClause(): { sql: string; values: any[] } {
        const where = this.getWhere();
        if (!where || Object.keys(where).length === 0) {
            return { sql: '', values: [] };
        }

        const whereClauses: string[] = [];
        const values: any[] = [];

        const skipKeys = ['or', 'not', 'between', 'in', 'exists', 'all', 'size', 'elemMatch', 'mod', 'expr', 'any', 'distinct', 'text', 'ilike', 'soundex', 'levenshtein', 'dateDiff'];

        for (const [key, value] of Object.entries(where)) {
            if (skipKeys.includes(key)) continue;

            if (typeof value === "object" && value !== null) {
                this.handleObjectOperator(key, value, whereClauses, values);
            } else {
                whereClauses.push(`"${key}" = ?`);
                values.push(value);
            }
        }

        return {
            sql: whereClauses.length > 0 ? whereClauses.join(' and ') : '',
            values
        };
    }

    private handleObjectOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (value.any !== undefined) {
            if (typeof value.any !== 'string' || value.any === '') {
                throw new QueryError(`"any" operator requires a non-empty string subquery for field "${key}"`, "D036");
            }
            if (!/^\s*SELECT/i.test(value.any)) {
                throw new QueryError(`"any" operator subquery must be a SELECT statement for field "${key}"`, "D036");
            }
            whereClauses.push(`"${key}" IN (${value.any})`);
            return;
        }

        if (value.all !== undefined) {
            if (typeof value.all === 'string') {
                if (value.all === '') {
                    throw new QueryError(`"all" subquery operator requires a non-empty string for field "${key}"`, "D036");
                }
                if (!/^\s*SELECT/i.test(value.all)) {
                    throw new QueryError(`"all" subquery operator must be a SELECT statement for field "${key}"`, "D036");
                }
                whereClauses.push(`"${key}" IN (${value.all})`);
                return;
            }
            if (!Array.isArray(value.all)) {
                throw new QueryError(`"all" operator requires an array value for field "${key}"`, "D036");
            }
            if (value.all.length === 0) {
                throw new QueryError(`"all" operator requires a non-empty array for field "${key}"`, "D036");
            }
            const conditions = value.all.map(() => `"${key}" LIKE ?`).join(' AND ');
            whereClauses.push(`(${conditions})`);
            for (const item of value.all) {
                values.push(`%${item}%`);
            }
            return;
        }

        if (value.isDistinctFrom !== undefined) {
            whereClauses.push(`"${key}" != ?`);
            values.push(value.isDistinctFrom);
            return;
        }

        if (value.text !== undefined) {
            if (typeof value.text !== 'string' || value.text === '') {
                throw new QueryError(`"text" operator requires a non-empty string for field "${key}"`, "D036");
            }
            whereClauses.push(`"${key}" LIKE ?`);
            values.push(`%${value.text}%`);
            return;
        }

        if (value.ilike !== undefined) {
            whereClauses.push(`LOWER("${key}") LIKE LOWER(?)`);
            values.push(value.ilike);
            return;
        }

        if (value.soundex !== undefined) {
            if (typeof value.soundex !== 'string' || value.soundex === '') {
                throw new QueryError(`"soundex" operator requires a non-empty string for field "${key}"`, "D036");
            }
            const firstLetters = value.soundex.trim().substring(0, 3);
            whereClauses.push(`"${key}" LIKE ?`);
            values.push(`${firstLetters}%`);
            return;
        }

        if (value.levenshtein !== undefined) {
            if (typeof value.levenshtein !== 'string' || value.levenshtein === '') {
                throw new QueryError(`"levenshtein" operator requires a non-empty string for field "${key}"`, "D036");
            }
            const term = value.levenshtein.trim();
            const firstLetters = term.substring(0, 3);
            const conditions = [
                `LOWER("${key}") = LOWER(?)`,
                `"${key}" LIKE ?`,
                `"${key}" LIKE ?`,
                `"${key}" LIKE ?`,
                `"${key}" LIKE ?`
            ];
            whereClauses.push(`(${conditions.join(' OR ')})`);
            values.push(term, `${term}%`, `%${term}%`, `${firstLetters}%`, `%${term}`);
            return;
        }

        if (value.dateDiff !== undefined) {
            if (!Array.isArray(value.dateDiff) || value.dateDiff.length !== 2) {
                throw new QueryError(`"dateDiff" requires [date1, date2] for field "${key}"`, "D036");
            }
            const [date1, date2] = value.dateDiff;
            const daysMatch = String(date2).match(/^(\d+)\s*days?$/i);
            if (!daysMatch) {
                throw new QueryError(`"dateDiff" second value must be like "90 days" for field "${key}"`, "D036");
            }
            const days = parseInt(daysMatch[1]);
            whereClauses.push(`julianday('now') - julianday("${key}") <= ?`);
            values.push(days);
            return;
        }

        if (value.mod !== undefined) {
            if (!Array.isArray(value.mod) || value.mod.length !== 2) {
                throw new QueryError(`"mod" requires [divisor, remainder] for field "${key}"`, "D036");
            }
            whereClauses.push(`"${key}" % ? = ?`);
            values.push(value.mod[0], value.mod[1]);
            return;
        }

        if (value.elemMatch !== undefined) {
            const field = Object.keys(value.elemMatch)[0];
            const val = Object.values(value.elemMatch)[0];
            whereClauses.push(`json_extract("${key}", '$[*]."${field}"') = ?`);
            values.push(val);
            return;
        }

        if (value.size !== undefined) {
            const op = typeof value.size === 'object' ? Object.keys(value.size)[0] : '=';
            const val = typeof value.size === 'object' ? Object.values(value.size)[0] : value.size;
            whereClauses.push(`json_array_length("${key}") ${op} ?`);
            values.push(val);
            return;
        }

        if (value.nin !== undefined) {
            if (!Array.isArray(value.nin) || value.nin.length === 0) {
                throw new QueryError(`"nin" requires a non-empty array for field "${key}"`, "D036");
            }
            const placeholders = value.nin.map(() => "?").join(", ");
            whereClauses.push(`"${key}" NOT IN (${placeholders})`);
            values.push(...value.nin);
            return;
        }

        if (value.exists !== undefined) {
            whereClauses.push(value.exists ? `"${key}" IS NOT NULL` : `"${key}" IS NULL`);
            return;
        }

        if (value.isNull !== undefined) {
            whereClauses.push(value.isNull ? `"${key}" IS NULL` : `"${key}" IS NOT NULL`);
            return;
        }

        if (value.regex !== undefined) {
            const likePattern = this.regexToLike(value.regex);
            whereClauses.push(`"${key}" LIKE ?`);
            values.push(likePattern);
            return;
        }

        if (value.startsWith !== undefined) {
            whereClauses.push(`"${key}" LIKE ?`);
            values.push(`${value.startsWith}%`);
            return;
        }

        if (value.endsWith !== undefined) {
            whereClauses.push(`"${key}" LIKE ?`);
            values.push(`%${value.endsWith}`);
            return;
        }

        if (value.contains !== undefined) {
            whereClauses.push(`"${key}" LIKE ?`);
            values.push(`%${value.contains}%`);
            return;
        }

        if (value.nthContain && typeof value.nthContain === "object") {
            const posMap: Record<string, number> = { "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5 };
            const allOrs: string[] = [];

            for (const [position, positionValue] of Object.entries(value.nthContain)) {
                const pos = posMap[position] || parseInt(position);
                if (isNaN(pos) || pos < 1) throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
                const prefix = "_".repeat(pos - 1);

                if (Array.isArray(positionValue)) {
                    const ors: string[] = [];
                    for (const val of positionValue) {
                        if (val === undefined || val === null) {
                            throw new QueryError(`"nthContain" value cannot be null or undefined at position "${position}" for field "${key}"`, "D036");
                        }
                        if (typeof val !== 'string') {
                            throw new QueryError(`"nthContain" values must be strings for field "${key}"`, "D036");
                        }
                        ors.push(`"${key}" LIKE ?`);
                        values.push(`${prefix}${val}%`);
                    }
                    allOrs.push(`(${ors.join(' OR ')})`);
                } else if (typeof positionValue === "string") {
                    if (positionValue === '') {
                        throw new QueryError(`"nthContain" requires a non-empty string at position "${position}" for field "${key}"`, "D036");
                    }
                    allOrs.push(`"${key}" LIKE ?`);
                    values.push(`${prefix}${positionValue}%`);
                } else {
                    throw new QueryError(`Invalid value for nthContain at position "${position}"`, "D036");
                }
            }

            whereClauses.push(`(${allOrs.join(' AND ')})`);
            return;
        }

        if (value.between !== undefined) {
            if (!Array.isArray(value.between) || value.between.length !== 2) {
                throw new QueryError(`"between" requires 2 values for field "${key}"`, "D036");
            }
            whereClauses.push(`"${key}" BETWEEN ? AND ?`);
            values.push(value.between[0], value.between[1]);
            return;
        }

        if (value.in !== undefined) {
            if (!Array.isArray(value.in) || value.in.length === 0) {
                throw new QueryError(`"in" requires a non-empty array for field "${key}"`, "D036");
            }
            const placeholders = value.in.map(() => "?").join(", ");
            whereClauses.push(`"${key}" IN (${placeholders})`);
            values.push(...value.in);
            return;
        }

        if (value.not !== undefined) {
            whereClauses.push(`"${key}" != ?`);
            values.push(value.not);
            return;
        }

        const opMap: Record<string, string> = { 'gt': '>', 'gte': '>=', 'lt': '<', 'lte': '<=', 'ne': '!=' };

        for (const [op, opVal] of Object.entries(value)) {
            if (op in opMap) {
                whereClauses.push(`"${key}" ${opMap[op]} ?`);
            } else {
                whereClauses.push(`"${key}" = ?`);
            }
            values.push(opVal);
        }
    }

    private buildExprSQL(expr: any): { sql: string; values: any[] } {
        if (expr === undefined || expr === null) {
            throw new QueryError("Expr cannot be null or undefined", "D036");
        }

        if (typeof expr === "string" && expr.startsWith("#")) {
            const field = expr.substring(1);

            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) {
                throw new QueryError(`Invalid field name "${field}" in expr`, "D036");
            }

            return {
                sql: `"${field}"`,
                values: []
            };
        }

        if (typeof expr !== "object" || Array.isArray(expr)) {
            return {
                sql: '?',
                values: [expr]
            };
        }

        const keys = Object.keys(expr);

        if (keys.length !== 1) {
            throw new QueryError("Expr object must contain exactly one operator", "D036");
        }

        const op = keys[0];
        const operand = expr[op];

        const comparison: Record<string, string> = {
            eq: "=",
            ne: "!=",
            gt: ">",
            gte: ">=",
            lt: "<",
            lte: "<="
        };

        if (comparison[op]) {
            if (!Array.isArray(operand) || operand.length !== 2) {
                throw new QueryError(`${op} requires two operands`, "D036");
            }

            const left = this.buildExprSQL(operand[0]);
            const right = this.buildExprSQL(operand[1]);

            return {
                sql: `${left.sql} ${comparison[op]} ${right.sql}`,
                values: [...left.values, ...right.values]
            };
        }

        if (op === "add" || op === "multiply") {
            if (!Array.isArray(operand) || operand.length < 2) {
                throw new QueryError(`${op} requires at least two operands`, "D036");
            }

            const operator = op === "add" ? "+" : "*";
            const sql: string[] = [];
            const values: any[] = [];

            for (const item of operand) {
                const result = this.buildExprSQL(item);
                sql.push(result.sql);
                values.push(...result.values);
            }

            return {
                sql: `(${sql.join(` ${operator} `)})`,
                values
            };
        }

        if (op === "subtract" || op === "divide") {
            if (!Array.isArray(operand) || operand.length !== 2) {
                throw new QueryError(`${op} requires two operands`, "D036");
            }

            const left = this.buildExprSQL(operand[0]);
            const right = this.buildExprSQL(operand[1]);

            return {
                sql: `(${left.sql} ${op === "subtract" ? "-" : "/"} ${right.sql})`,
                values: [...left.values, ...right.values]
            };
        }

        throw new QueryError(`Unknown expr operator "${op}"`, "D036");
    }

    private regexToLike(regex: string): string {
        let like = regex;

        // Convert .* to %
        like = like.replace(/\.\*/g, "%");

        // Handle ^ (start anchor)
        if (like.startsWith("^")) {
            like = like.slice(1);
        } else {
            like = "%" + like;
        }

        // Handle $ (end anchor)
        if (like.endsWith("$")) {
            like = like.slice(0, -1);
        } else {
            like = like + "%";
        }

        return like;
    }
}