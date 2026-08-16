import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getPostgresType } from "./Types";
import { Model } from "../../model";


/**
 * PostgreSQL query handler class
 * Translates DataBridge queries into PostgreSQL operations
 */
export default class PostgresQuery extends BaseQuery {
    protected connection: any;
    protected readonly model: Model | null;

    constructor(query: Query, pool: unknown, model: Model | null = null) {
        super(query);
        this.connection = pool;
        this.model = model;
    }

    protected mapType(type: string): string {
        return getPostgresType(type);
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

                case "update":
                    return await this.handleUpdate();

                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        }

        catch (error) {
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }

            throw new QueryError(`PostgreSQL query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
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

        const tables = await this.connection.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`,[this.tableName]);

        if (tables.rows && tables.rows.length > 0) {
            throw new SchemaError(`Table "${this.tableName}" already exists`, "D043");
        }

        const columns = Object.entries(this.fields).map(([field, type]) => `"${field}" ${type}`).join(",");
        const createTableSQL = `create table if not exists "${this.tableName}" (id serial primary key, ${columns})`;

        await this.connection.query(createTableSQL);
    }

    private async handleCreateObject(): Promise<void> {
        const row = this.data!.data as Record<string, unknown>;

        this.getFieldTypes(this.model);

        const processedRow = this.processRowData(row, this.model)

        const cols = Object.keys(processedRow).map(col => `"${col}"`).join(", ");
        const placeholders = Object.keys(processedRow).map((_, i) => `$${i + 1}`).join(", ");

        const sql = `insert into "${this.tableName}" (${cols}) values (${placeholders})`;
        await this.connection.query(sql, Object.values(processedRow));
    }

    private async handleFind(): Promise<any[]> {
        try {
            await this.ensureTableExists();

            const where = this.getWhere();

            if (!where || Object.keys(where).length === 0) {
                const result = await this.executeQuery(`select * from "${this.tableName}"`);
                return this.sterilizeResult(result, this.model);
            }

            console.log()

            const topLevelResult = await this.handleTopLevelOperators(false);
            if (topLevelResult !== null) {
                return this.sterilizeResult(topLevelResult, this.model);
            }

            // these logs are to stop my ide from telling me about duplicate code
            console.log()

            const { sql, values } = this.buildWhereClause();
            const fullSql = sql ? `select * from "${this.tableName}" where ${sql}` : `select * from "${this.tableName}"`;
            const result = await this.executeQuery(fullSql, values);
            return this.sterilizeResult(result || [], this.model);

        }

        catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }

            throw new QueryError(`Failed to query table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private async handleFindOne(): Promise<any | null> {
        try {
            await this.ensureTableExists();


            let values: any[] = [];
            let sql = `select * from "${this.tableName}"`;

            const where = this.getWhere();

            if (where && typeof where === "object" && Object.keys(where).length > 0) {
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
            return this.sterilizeResult(result[0], this.model);
        }

        catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }

            throw new QueryError(`Failed to find one in table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    /**
     * Handles UPDATE operations for PostgreSQL
     * Updates records matching the where clause with the set values
     * @returns {Promise<any[] | null>} - Array of updated records if RETURNING specified, otherwise null
     * @throws {QueryError} - If where clause lacks 'set' field or set is invalid
     * @throws {SchemaError} - If table doesn't exist
     */
    private async handleUpdate(): Promise<any[] | null> {
        try {
            await this.ensureTableExists();

            const where = this.getWhere();
            const options: unknown = this.query.data?.options || null

            const values: unknown[] = [];
            let sql: string = "";

            if (!(where.hasOwnProperty("set"))) {
                throw new QueryError("\"update clause has no set field\"", "D030");
            }

            const whereParts = Object.entries(where);
            const findClause = whereParts.filter((part) => {
                return part[0] !== "set"
            });

            if (!(where.set instanceof Object) || Object.keys(where.set).length === 0) {
                throw new QueryError("Invalid set type", "D030");
            }

            const setFields = Object.entries(where.set);

            // Build SET and WHERE clauses with parameterized placeholders
            const setClause = setFields.map(([key], i) => `${key} = $${i + 1}`).join(", ");
            let whereClause = "";

            let index = setFields.length + 1;
            const totalConditions = findClause.length;
            let conditionIndex = 0;

            for (const field of setFields) {
                values.push(field[1]);
            }

            for (const clause of findClause) {
                const isLastClause = conditionIndex === totalConditions - 1;

                if (typeof clause[1] === "object") {
                    const destruct = Object.entries(clause[1] as object);

                    const operatorCount = destruct.length;
                    let operatorIndex = 0;

                    for (const [operator, value] of destruct) {
                        const key = clause[0];
                        const isLastOperator = operatorIndex === operatorCount - 1 && isLastClause;

                        switch (operator) {
                            case "gt":
                                isLastOperator ? whereClause += `${key} > $${index}` : whereClause += `${key} > $${index} and `
                                values.push(value);

                                index++;
                                break;

                            case "lt":
                                isLastOperator ? whereClause += `${key} < $${index}` : whereClause += `${key} < $${index} and `
                                values.push(value);

                                index++;
                                break;

                            case "gte":
                                isLastOperator ? whereClause += `${key} >= $${index}` : whereClause += `${key} >= $${index} and `
                                values.push(value);

                                index++;
                                break;

                            case "lte":
                                isLastOperator ? whereClause += `${key} <= $${index}` : whereClause += `${key} <= $${index} and `
                                values.push(value);

                                index++;
                                break;

                            case "ne":
                                isLastOperator ? whereClause += `${key} != $${index}` : whereClause += `${key} != $${index} and `
                                values.push(value);

                                index++;
                                break;

                            case "not":
                                isLastOperator ? whereClause += `${key} != $${index}` : whereClause += `${key} != $${index} and `
                                values.push(value);

                                index++;
                                break;

                            case "between":
                                if (!Array.isArray(value)) {
                                    throw new QueryError("Value for between query must be an array", "D033");
                                }

                                if (value.length !== 2) {
                                    throw new QueryError("Value for between query must have 2 elements", "D033");
                                }

                                isLastOperator ? whereClause += `${key} between $${index} and $${index + 1}` : whereClause += `${key} between $${index} and $${index + 1} and `
                                values.push(value[0], value[1]);

                                index += 2;
                                break;

                            case "in":
                                if (!Array.isArray(value)) {
                                    throw new QueryError("Value for in query must be an array", "D033");
                                }

                                if (value.length === 0) {
                                    throw new QueryError("Value for in query cannot be empty", "D033");
                                }

                                const placeholders = value.map((_, i) => `$${index + i}`).join(", ");
                                isLastOperator ? whereClause += `${key} in (${placeholders})` : whereClause += `${key} in (${placeholders}) and `
                                values.push(...value);

                                index += value.length;
                                break;

                            case "nin":
                                if (!Array.isArray(value)) {
                                    throw new QueryError("Value for nin query must be an array", "D033");
                                }

                                if (value.length === 0) {
                                    throw new QueryError("Value for nin query cannot be empty", "D033");
                                }

                                const pls = value.map((_, i) => `$${index + i}`).join(", ");
                                isLastOperator ? whereClause += `${key} not in (${pls})` : whereClause += `${key} not in (${pls}) and `

                                values.push(...value);
                                index += value.length;
                                break;

                            case "startsWith":
                                isLastOperator ? whereClause += `${key} like $${index}` : whereClause += `${key} like $${index} and `
                                values.push(`${value}%`);

                                index++;
                                break;

                            case "endsWith":
                                isLastOperator ? whereClause += `${key} like $${index}` : whereClause += `${key} like $${index} and `
                                values.push(`%${value}`);

                                index++;
                                break;

                            case "contains":
                                isLastOperator ? whereClause += `${key} like $${index}` : whereClause += `${key} like $${index} and `
                                values.push(`%${value}%`);

                                index++;
                                break;

                            case "nthContain":
                                if (typeof value !== "object") {
                                    throw new QueryError("Value for nthContain query must be an object", "D033");
                                }

                                const nthEntries = Object.entries(value);
                                const positionGroups: string[] = [];

                                for (const [k, v] of nthEntries) {
                                    let prefix = "";
                                    switch (k) {
                                        case "first":
                                            prefix = "";
                                            break;

                                        case "second":
                                            prefix = "_";
                                            break;

                                        case "third":
                                            prefix = "__";
                                            break;

                                        default: throw new QueryError(`Invalid position "${k}" for nthContain`, "D033");
                                    }

                                    if (typeof v === "string") {
                                        positionGroups.push(`${key} like $${index}`);
                                        values.push(`${prefix}${v}%`);
                                        index++;
                                    }

                                    else if (Array.isArray(v)) {
                                        const orConditions: string[] = [];

                                        for (const val of v) {
                                            orConditions.push(`${key} like $${index}`);
                                            values.push(`${prefix}${val}%`);
                                            index++;
                                        }

                                        positionGroups.push(`(${orConditions.join(" or ")})`);
                                    }

                                    else {
                                        throw new QueryError("Invalid value for nthContain query", "D033");
                                    }
                                }

                                const combined = positionGroups.length > 1 ? positionGroups.join(" and ") : positionGroups[0];
                                isLastOperator ? whereClause += combined : whereClause += `${combined} and `;
                                break;
                        }

                        operatorIndex++;
                    }
                }

                else {
                    isLastClause ? whereClause += `${clause[0]} = $${index}` : whereClause += `${clause[0]} = $${index} and `
                    values.push(clause[1]);
                    index++;
                }

                conditionIndex++;
            }

            sql += `update "${this.tableName}" set ${setClause} where ${whereClause}`
            console.log(sql, values);

            // Handle RETURNING clause if specified in options
            // if (this.isReturnOption(options)) {
            //     const option = options as string;
            //     const parts = option.split(" ").map((part) => part.replace(/,$/, ""));
            //
            //     if (parts[1].trim().toLowerCase() === "all") {
            //         sql += ` returning *`
            //     }
            //
            //     else {
            //         const fields = parts.slice(1);
            //         const returnFields = fields.map((field) => `${field}`).join(", ");
            //         sql += ` returning ${returnFields}`
            //     }
            // }
            //
            // const results = await this.executeQuery(sql, values);
            //
            // return options ? results : null;
            return null;
        }

        catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }

            throw new QueryError(`Failed to update table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private isReturnOption(option: any): boolean {
        return typeof option === "string" && option.split(" ")[0].trim() === "return";
    }

    private async ensureTableExists(): Promise<void> {
        const tableCheck = await this.connection.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = $1`,[this.tableName]);

        if (!tableCheck.rows || tableCheck.rows.length === 0) {
            throw new SchemaError(`Table "${this.tableName}" does not exist`, "D044");
        }
    }

    private async executeQuery(sql: string, values: any[] = []): Promise<any> {
        const result = await this.connection.query(sql, values);
        return result.rows || result;
    }

    private async handleTopLevelOperators(isFindOne: boolean): Promise<any | null> {
        const where = this.getWhere();
        if (!where || Object.keys(where).length === 0) return null;

        if (where.expr && typeof where.expr === "object") {
            const idx = { value: 1 };
            const exprSQL = this.buildExprSQL(where.expr, idx);

            const sql = `select * from "${this.tableName}" where ${exprSQL.sql}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, exprSQL.values);

            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        if (where.or && Array.isArray(where.or)) {
            const whereClauses: string[] = [];
            const values: any[] = [];
            const idx = { value: 1 };

            for (const condition of where.or) {
                for (const [key, value] of Object.entries(condition)) {
                    whereClauses.push(`"${key}" = $${idx.value}`);
                    values.push(value);
                    idx.value++;
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
            const idx = { value: 1 };

            for (const [key, value] of Object.entries(notConditions)) {
                whereClauses.push(`"${key}" != $${idx.value}`);
                values.push(value);
                idx.value++;
            }

            const sql = `select * from "${this.tableName}" where ${whereClauses.join(' and ')}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, values);

            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        if (where.exists && typeof where.exists === "object" && !Array.isArray(where.exists)) {
            if (where.exists.relation && where.exists.where) {
                const relation = where.exists.relation;
                const whereClause = where.exists.where;
                const subWhere = Object.entries(whereClause).map(([key, value]) => `"${key}" = "${value}"`).join(' and ');

                const sql = `select * from "${this.tableName}" where exists (select 1 from "${relation}" where ${subWhere})${isFindOne ? ' limit 1' : ''}`;
                const result = await this.connection.query(sql);

                return isFindOne ? (result.rows && result.rows.length > 0 ? result.rows[0] : null) : (result.rows || []);
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
        const idx = { value: 1 };

        const skipKeys = ['or', 'not', 'between', 'in', 'exists', 'all', 'size', 'elemMatch', 'mod', 'expr', 'any', 'distinct', 'text', 'ilike', 'soundex', 'levenshtein', 'dateDiff'];

        for (const [key, value] of Object.entries(where)) {
            if (skipKeys.includes(key)) continue;

            if (typeof value === "object" && value !== null) {
                this.handleObjectOperator(key, value, whereClauses, values, idx);
            }

            else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                if (value === '') {
                    throw new QueryError(`Regex pattern cannot be empty for field "${key}"`, "D036");
                }

                whereClauses.push(`"${key}" ~ $${idx.value}`);
                values.push(value);
                idx.value++;
            }

            else {
                whereClauses.push(`"${key}" = $${idx.value}`);
                values.push(value);
                idx.value++;
            }
        }

        return {
            sql: whereClauses.length > 0 ? whereClauses.join(' and ') : '',
            values
        };
    }

    private handleObjectOperator(key: string, value: any, whereClauses: string[], values: any[], idx: { value: number }): void {
        if (value.any !== undefined) {
            if (typeof value.any !== 'string' || value.any === '') {
                throw new QueryError(`"any" operator requires a non-empty string subquery for field "${key}"`, "D036");
            }

            if (!/^\s*select/i.test(value.any)) {
                throw new QueryError(`"any" operator subquery must be a select statement for field "${key}"`, "D036");
            }

            whereClauses.push(`"${key}" = any (${value.any})`);
            return;
        }

        if (value.all !== undefined) {
            if (typeof value.all === 'string') {
                if (value.all === '') {
                    throw new QueryError(`"all" subquery operator requires a non-empty string for field "${key}"`, "D036");
                }

                if (!/^\s*select/i.test(value.all)) {
                    throw new QueryError(`"all" subquery operator must be a SELECT statement for field "${key}"`, "D036");
                }
                whereClauses.push(`"${key}" = all (${value.all})`);
                return;
            }

            if (!Array.isArray(value.all)) {
                throw new QueryError(`"all" operator requires an array value for field "${key}"`, "D036");
            }

            if (value.all.length === 0) {
                throw new QueryError(`"all" operator requires a non-empty array for field "${key}"`, "D036");
            }

            const conditions = value.all.map(() => `"${key}" ILIKE $${idx.value}`).join(' and ');
            whereClauses.push(`(${conditions})`);

            for (const item of value.all) {
                values.push(`%${item}%`);
                idx.value++;
            }
            return;
        }

        if (value.isDistinctFrom !== undefined) {
            whereClauses.push(`"${key}" != $${idx.value}`);
            values.push(value.isDistinctFrom);

            idx.value++;
            return;
        }

        if (value.text !== undefined) {
            if (typeof value.text !== 'string' || value.text === '') {
                throw new QueryError(`"text" operator requires a non-empty string for field "${key}"`, "D036");
            }

            const tsquery = value.text.trim().split(/\s+/).map((word: string) => word.replace(/['\\]/g, '')).filter((word: string) => word.length > 0).join(' & ');

            if (!tsquery) {
                throw new QueryError(`"text" operator produced invalid tsquery for field "${key}"`, "D036");
            }

            whereClauses.push(`to_tsvector("${key}") @@ to_tsquery($${idx.value})`);
            values.push(tsquery);
            idx.value++;
            return;
        }

        if (value.ilike !== undefined) {
            whereClauses.push(`"${key}" ILIKE $${idx.value}`);
            values.push(value.ilike);

            idx.value++;
            return;
        }

        if (value.soundex !== undefined) {
            if (typeof value.soundex !== 'string' || value.soundex === '') {
                throw new QueryError(`"soundex" operator requires a non-empty string for field "${key}"`, "D036");
            }

            const firstLetters = value.soundex.trim().substring(0, 3);
            whereClauses.push(`"${key}" ILIKE $${idx.value}`);

            values.push(`${firstLetters}%`);
            idx.value++;
            return;
        }

        if (value.levenshtein !== undefined) {
            if (typeof value.levenshtein !== 'string' || value.levenshtein === '') {
                throw new QueryError(`"levenshtein" operator requires a non-empty string for field "${key}"`, "D036");
            }

            const term = value.levenshtein.trim();
            const firstLetters = term.substring(0, 3);

            const conditions = [
                `lower("${key}") = lower($${idx.value})`,
                `"${key}" ILIKE $${idx.value + 1}`,
                `"${key}" ILIKE $${idx.value + 2}`,
                `"${key}" ILIKE $${idx.value + 3}`,
                `"${key}" ILIKE $${idx.value + 4}`
            ];

            whereClauses.push(`(${conditions.join(' or ')})`);
            values.push(term, `${term}%`, `%${term}%`, `${firstLetters}%`, `%${term}`);
            idx.value += 5;
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

            let dateExpr: string;

            if (String(date1).toLowerCase() === 'now') {
                dateExpr = 'now()';
            }

            else {
                dateExpr = `$${idx.value}`;
                values.push(date1);
                idx.value++;
            }

            whereClauses.push(`extract(day from (${dateExpr} - "${key}")) <= $${idx.value}`);
            values.push(days);
            idx.value++;
            return;
        }

        if (value.mod !== undefined) {
            if (!Array.isArray(value.mod) || value.mod.length !== 2) {
                throw new QueryError(`"mod" requires [divisor, remainder] for field "${key}"`, "D036");
            }

            whereClauses.push(`mod("${key}", $${idx.value}) = $${idx.value + 1}`);
            values.push(value.mod[0], value.mod[1]);
            idx.value += 2;
            return;
        }

        if (value.elemMatch !== undefined) {
            const field = Object.keys(value.elemMatch)[0];
            const val = Object.values(value.elemMatch)[0];

            whereClauses.push(`json_extract("${key}", '$[*]."${field}"') = $${idx.value}`);
            values.push(val);

            idx.value++;
            return;
        }

        if (value.size !== undefined) {
            const op = typeof value.size === 'object' ? Object.keys(value.size)[0] : '=';
            const val = typeof value.size === 'object' ? Object.values(value.size)[0] : value.size;

            whereClauses.push(`json_array_length("${key}") ${op} $${idx.value}`);
            values.push(val);

            idx.value++;
            return;
        }

        if (value.nin !== undefined) {
            if (!Array.isArray(value.nin) || value.nin.length === 0) {
                throw new QueryError(`"nin" requires a non-empty array for field "${key}"`, "D036");
            }

            const placeholders = value.nin.map((_: any, i: number) => `$${idx.value + i}`).join(", ");
            whereClauses.push(`"${key}" not in (${placeholders})`);

            values.push(...value.nin);
            idx.value += value.nin.length;
            return;
        }

        if (value.exists !== undefined) {
            whereClauses.push(value.exists ? `"${key}" is not null` : `"${key}" is null`);
            return;
        }

        if (value.isNull !== undefined) {
            whereClauses.push(value.isNull ? `"${key}" is null` : `"${key}" is not null`);
            return;
        }

        if (value.regex !== undefined) {
            whereClauses.push(`"${key}" ~ $${idx.value}`);
            values.push(value.regex);

            idx.value++;
            return;
        }

        if (value.startsWith !== undefined) {
            whereClauses.push(`"${key}" ILIKE $${idx.value}`);
            values.push(`${value.startsWith}%`);

            idx.value++;
            return;
        }

        if (value.endsWith !== undefined) {
            whereClauses.push(`"${key}" ILIKE $${idx.value}`);
            values.push(`%${value.endsWith}`);

            idx.value++;
            return;
        }

        if (value.contains !== undefined) {
            whereClauses.push(`"${key}" ILIKE $${idx.value}`);
            values.push(`%${value.contains}%`);

            idx.value++;
            return;
        }

        if (value.nthContain && typeof value.nthContain === "object") {
            const posMap: Record<string, number> = { "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5 };
            const allOrs: string[] = [];

            for (const [position, positionValue] of Object.entries(value.nthContain)) {
                const pos = posMap[position] || parseInt(position);

                if (isNaN(pos) || pos < 1) {
                    throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
                }

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

                        ors.push(`"${key}" ILIKE $${idx.value}`);
                        values.push(`${prefix}${val}%`);
                        idx.value++;
                    }

                    allOrs.push(`(${ors.join(' OR ')})`);
                }

                else if (typeof positionValue === "string") {
                    if (positionValue === '') {
                        throw new QueryError(`"nthContain" requires a non-empty string at position "${position}" for field "${key}"`, "D036");
                    }

                    allOrs.push(`"${key}" ILIKE $${idx.value}`);
                    values.push(`${prefix}${positionValue}%`);
                    idx.value++;
                }

                else {
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

            whereClauses.push(`"${key}" between $${idx.value} and $${idx.value + 1}`);
            values.push(value.between[0], value.between[1]);

            idx.value += 2;
            return;
        }

        if (value.in !== undefined) {
            if (!Array.isArray(value.in) || value.in.length === 0) {
                throw new QueryError(`"in" requires a non-empty array for field "${key}"`, "D036");
            }
            const placeholders = value.in.map((_: any, i: number) => `$${idx.value + i}`).join(", ");
            whereClauses.push(`"${key}" in (${placeholders})`);

            values.push(...value.in);
            idx.value += value.in.length;
            return;
        }

        if (value.not !== undefined) {
            whereClauses.push(`"${key}" != $${idx.value}`);
            values.push(value.not);

            idx.value++;
            return;
        }

        const opMap: Record<string, string> = { 'gt': '>', 'gte': '>=', 'lt': '<', 'lte': '<=', 'ne': '!=' };

        for (const [op, opVal] of Object.entries(value)) {
            if (op in opMap) {
                whereClauses.push(`"${key}" ${opMap[op]} $${idx.value}`);
            }

            else {
                whereClauses.push(`"${key}" = $${idx.value}`);
            }

            values.push(opVal);
            idx.value++;
        }
    }

    private buildExprSQL(expr: any, index: { value: number }): { sql: string; values: any[] } {

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
            const placeholder = `$${index.value}`;
            index.value++;

            return {
                sql: placeholder,
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

            const left = this.buildExprSQL(operand[0], index);
            const right = this.buildExprSQL(operand[1], index);

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
                const result = this.buildExprSQL(item, index);
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

            const left = this.buildExprSQL(operand[0], index);
            const right = this.buildExprSQL(operand[1], index);

            return {
                sql: `(${left.sql} ${op === "subtract" ? "-" : "/"} ${right.sql})`,
                values: [...left.values, ...right.values]
            };
        }

        throw new QueryError(`Unknown expr operator "${op}"`, "D036");
    }
}