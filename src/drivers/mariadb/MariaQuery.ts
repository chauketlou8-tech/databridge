import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getMariaType } from "./Types";
import type { Model } from "../../model";

/**
 * MariaDB query handler class
 * Translates DataBridge queries into MariaDB operations
 */
export default class MariaQuery extends BaseQuery {
    protected connection: any;
    protected tableName: string;
    private model: Model | null;

    constructor(query: Query, connection: unknown, model: Model | null = null) {
        super(query);
        this.connection = connection;
        this.tableName = "";
        this.fields = {};
        this.model = model;
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
            throw new QueryError(`MariaDB query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    // ==================== CREATE HANDLER ====================

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

        const tables = await this.connection.query(
            "select table_name from information_schema.tables where table_schema = DATABASE() and table_name = ?",
            [this.tableName]
        );
        if (tables && tables.length > 0 && tables[0].TABLE_NAME) {
            throw new SchemaError(`Table "${this.tableName}" already exists`, "D043");
        }

        const columns = Object.entries(this.fields)
            .map(([field, type]) => `${field} ${type}`)
            .join(",");

        const createTableSQL = `create table if not exists \`${this.tableName}\` (id int primary key auto_increment,${columns})`;

        await this.connection.query(createTableSQL);
    }

    private async handleCreateObject(): Promise<void> {
        const row = this.data!.data as Record<string, unknown>;
        const processedRow = this.processRowData(row, this.model);

        const cols = Object.keys(processedRow).map(col => `\`${col}\``).join(", ");
        const placeholders = Object.keys(processedRow).map(() => "?").join(", ");

        const sql = `insert into \`${this.tableName}\` (${cols}) values (${placeholders})`;

        await this.connection.query(sql, Object.values(processedRow));
    }

    // ==================== FIND HANDLER ====================

    private async handleFind(): Promise<any[]> {
        try {
            await this.ensureTableExists();

            const where = this.getWhere();
            if (!where || Object.keys(where).length === 0) {
                const result = await this.executeQuery(`select * from \`${this.tableName}\``);
                return this.sterilizeResult(result, this.model);
            }

            const topLevelResult = await this.handleTopLevelOperators(false);
            if (topLevelResult !== null) {
                return this.sterilizeResult(topLevelResult, this.model);
            }

            const { sql, values } = this.buildWhereClause();
            const fullSql = sql ? `select * from \`${this.tableName}\` where ${sql}` : `select * from \`${this.tableName}\``;
            const result = await this.executeQuery(fullSql, values);
            return this.sterilizeResult(result || [], this.model);

        } catch (error) {
            if (error instanceof SchemaError || error instanceof QueryError) {
                throw error;
            }
            throw new QueryError(`Failed to query table "${this.tableName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    // ==================== FINDONE HANDLER ====================

    private async handleFindOne(): Promise<any | null> {
        try {
            await this.ensureTableExists();

            let sql = `select * from \`${this.tableName}\``;
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

    // ==================== DATABASE HELPERS ====================

    private async tableExists(): Promise<boolean> {
        const result = await this.connection.query(
            "select table_name from information_schema.tables where table_schema = DATABASE() and table_name = ?",
            [this.tableName]
        );
        return result && result.length > 0 && result[0].TABLE_NAME;
    }

    private async ensureTableExists(): Promise<void> {
        const exists = await this.tableExists();
        if (!exists) {
            throw new SchemaError(`Table "${this.tableName}" does not exist`, "D044");
        }
    }

    private async executeQuery(sql: string, values: any[] = []): Promise<any> {
        return await this.connection.query(sql, values);
    }

    // ==================== TOP LEVEL OPERATORS ====================

    private async handleTopLevelOperators(isFindOne: boolean): Promise<any | null> {
        const where = this.getWhere();
        if (!where || Object.keys(where).length === 0) return null;

        // Handle EXPR at top level
        if (where.expr && typeof where.expr === "object") {
            const exprSQL = this.buildExprSQL(where.expr);
            const sql = `select * from \`${this.tableName}\` where ${exprSQL.sql}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, exprSQL.values);
            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        // Handle OR conditions
        if (where.or && Array.isArray(where.or)) {
            const whereClauses: string[] = [];
            const values: any[] = [];

            for (const condition of where.or) {
                for (const [key, value] of Object.entries(condition)) {
                    whereClauses.push(`\`${key}\` = ?`);
                    values.push(value);
                }
            }

            const sql = `select * from \`${this.tableName}\` where ${whereClauses.join(' or ')}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, values);
            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        // Handle NOT operator
        if (where.not && typeof where.not === "object") {
            const notConditions = where.not;
            const whereClauses: string[] = [];
            const values: any[] = [];

            for (const [key, value] of Object.entries(notConditions)) {
                whereClauses.push(`\`${key}\` != ?`);
                values.push(value);
            }

            const sql = `select * from \`${this.tableName}\` where ${whereClauses.join(' and ')}${isFindOne ? ' limit 1' : ''}`;
            const result = await this.executeQuery(sql, values);
            return isFindOne ? (result[0] ?? null) : (result || []);
        }

        // Handle EXISTS subquery (object form with relation)
        if (where.exists && typeof where.exists === "object" && !Array.isArray(where.exists)) {
            if (where.exists.relation && where.exists.where) {
                const existsConditions = where.exists;
                const relation = existsConditions.relation;
                const whereClause = existsConditions.where;

                if (relation && whereClause) {
                    const subWhere = Object.entries(whereClause)
                        .map(([key, value]) => `\`${key}\` = \`${value}\``)
                        .join(' AND ');
                    const sql = `select * from \`${this.tableName}\` where exists (select 1 from \`${relation}\` where ${subWhere})${isFindOne ? ' limit 1' : ''}`;
                    const result = await this.executeQuery(sql);
                    return isFindOne ? (result[0] ?? null) : (result || []);
                }
            }
        }

        return null;
    }

    // ==================== WHERE CLAUSE BUILDER ====================

    private buildWhereClause(): { sql: string; values: any[] } {
        const where = this.getWhere();
        if (!where || Object.keys(where).length === 0) {
            return { sql: '', values: [] };
        }

        const whereClauses: string[] = [];
        const values: any[] = [];

        const skipKeys = ['or', 'not', 'between', 'in', 'exists', 'all', 'size', 'elemMatch', 'mod', 'expr', 'any', 'distinct', 'text', 'ilike', 'soundex', 'levenshtein', 'dateDiff'];

        for (const [key, value] of Object.entries(where)) {
            if (skipKeys.includes(key)) {
                continue;
            }

            if (typeof value === "object" && value !== null) {
                this.handleObjectOperator(key, value, whereClauses, values);
            } else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                if (value === '') {
                    throw new QueryError(`Regex pattern cannot be empty for field "${key}"`, "D036");
                }
                whereClauses.push(`\`${key}\` regexp ?`);
                values.push(value);
            } else {
                whereClauses.push(`\`${key}\` = ?`);
                values.push(value);
            }
        }

        return {
            sql: whereClauses.length > 0 ? whereClauses.join(' and ') : '',
            values
        };
    }

    // ==================== OBJECT OPERATOR ROUTER ====================

    private handleObjectOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        // Handle ANY subquery
        if (value.any !== undefined) {
            this.handleAnyOperator(key, value.any, whereClauses, values);
            return;
        }

        // Handle ALL subquery (string form)
        if (value.all !== undefined) {
            if (typeof value.all === 'string') {
                this.handleAllSubqueryOperator(key, value.all, whereClauses);
                return;
            }
            this.handleAllOperator(key, value.all, whereClauses, values);
            return;
        }

        // Handle DISTINCT operator
        if (value.isDistinctFrom !== undefined) {
            this.handleDistinctOperator(key, value.isDistinctFrom, whereClauses, values);
            return;
        }

        // Handle TEXT search
        if (value.text !== undefined) {
            this.handleTextOperator(key, value.text, whereClauses, values);
            return;
        }

        // Handle ILIKE (case-insensitive)
        if (value.ilike !== undefined) {
            this.handleIlikeOperator(key, value.ilike, whereClauses, values);
            return;
        }

        // Handle SOUNDEX (phonetic)
        if (value.soundex !== undefined) {
            this.handleSoundexOperator(key, value.soundex, whereClauses, values);
            return;
        }

        // Handle LEVENSHTEIN (similarity)
        if (value.levenshtein !== undefined) {
            this.handleLevenshteinOperator(key, value.levenshtein, whereClauses, values);
            return;
        }

        // Handle DATE DIFF
        if (value.dateDiff !== undefined) {
            this.handleDateDiffOperator(key, value.dateDiff, whereClauses, values);
            return;
        }

        // Handle MOD operator
        if (value.mod !== undefined) {
            this.handleModOperator(key, value.mod, whereClauses, values);
            return;
        }

        // Handle ELEM MATCH operator
        if (value.elemMatch !== undefined) {
            this.handleElemMatch(key, value.elemMatch, whereClauses, values);
            return;
        }

        // Handle SIZE operator
        if (value.size !== undefined) {
            this.handleSizeOperator(key, value.size, whereClauses, values);
            return;
        }

        // Handle NIN operator
        if (value.nin !== undefined) {
            this.handleNinOperator(key, value.nin, whereClauses, values);
            return;
        }

        // Handle EXISTS operator (field level)
        if (value.exists !== undefined) {
            this.handleExistsOperator(key, value.exists, whereClauses);
            return;
        }

        // Handle IS NULL operator
        if (value.isNull !== undefined) {
            this.handleIsNullOperator(key, value.isNull, whereClauses);
            return;
        }

        // Handle REGEX operator
        if (value.regex !== undefined) {
            this.handleRegexOperator(key, value.regex, whereClauses, values);
            return;
        }

        // Handle STARTS WITH operator
        if (value.startsWith !== undefined) {
            this.handleStartsWithOperator(key, value.startsWith, whereClauses, values);
            return;
        }

        // Handle ENDS WITH operator
        if (value.endsWith !== undefined) {
            this.handleEndsWithOperator(key, value.endsWith, whereClauses, values);
            return;
        }

        // Handle CONTAINS operator
        if (value.contains !== undefined) {
            this.handleContainsOperator(key, value.contains, whereClauses, values);
            return;
        }

        // Handle NTH CONTAIN operator
        if (value.nthContain && typeof value.nthContain === "object") {
            this.handleNthContainOperator(key, value.nthContain, whereClauses, values);
            return;
        }

        // Handle BETWEEN operator
        if (value.between !== undefined) {
            this.handleBetweenOperator(key, value.between, whereClauses, values);
            return;
        }

        // Handle IN operator
        if (value.in !== undefined) {
            this.handleInOperator(key, value.in, whereClauses, values);
            return;
        }

        // Handle nested NOT operator
        if (value.not !== undefined) {
            if (value.not === null) {
                throw new QueryError(`"not" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
            whereClauses.push(`\`${key}\` != ?`);
            values.push(value.not);
            return;
        }

        // Handle comparison operators
        for (const [operator, opValue] of Object.entries(value)) {
            if (operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte') {
                if (opValue === undefined || opValue === null) {
                    throw new QueryError(`"${operator}" operator value cannot be null or undefined for field "${key}"`, "D036");
                }
            }
            if (typeof opValue === 'string' && isNaN(Number(opValue))) {
                if (['gte', 'gt', 'lte', 'lt'].includes(operator)) {
                    throw new QueryError(`"${operator}" operator requires a number value for field "${key}"`, "D036");
                }
            }
            if (typeof opValue === 'object' && opValue !== null && !Array.isArray(opValue)) {
                throw new QueryError(`Invalid value type for operator "${operator}" on field "${key}"`, "D036");
            }
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
    }

    // ==================== OPERATOR HANDLERS ====================

    private handleAnyOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"any" operator requires a non-empty string subquery for field "${key}"`, "D036");
        }
        if (!/^\s*SELECT/i.test(value)) {
            throw new QueryError(`"any" operator subquery must be a SELECT statement for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` = ANY (${value})`);
    }

    private handleAllSubqueryOperator(key: string, value: any, whereClauses: string[]): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"all" subquery operator requires a non-empty string for field "${key}"`, "D036");
        }
        if (!/^\s*SELECT/i.test(value)) {
            throw new QueryError(`"all" subquery operator must be a SELECT statement for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` = ALL (${value})`);
    }

    private handleDistinctOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"isDistinctFrom" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` != ?`);
        values.push(value);
    }

    private handleTextOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"text" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` LIKE ?`);
        values.push(`%${value}%`);
    }

    private handleIlikeOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"ilike" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`LOWER(\`${key}\`) LIKE LOWER(?)`);
        values.push(value);
    }

    private handleSoundexOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"soundex" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`SOUNDEX(\`${key}\`) = SOUNDEX(?)`);
        values.push(value);
    }

    private handleLevenshteinOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (typeof value !== 'string' || value === '') {
            throw new QueryError(`"levenshtein" operator requires a non-empty string for field "${key}"`, "D036");
        }

        const searchTerm = value.trim();

        // Build a combination of conditions for fuzzy matching
        const conditions: string[] = [];

        // 1. Exact match (case insensitive)
        conditions.push(`LOWER(\`${key}\`) = LOWER(?)`);
        values.push(searchTerm);

        // 2. Starts with
        conditions.push(`LOWER(\`${key}\`) LIKE LOWER(?)`);
        values.push(`${searchTerm}%`);

        // 3. Contains
        conditions.push(`LOWER(\`${key}\`) LIKE LOWER(?)`);
        values.push(`%${searchTerm}%`);

        // 4. Soundex (phonetic matching)
        conditions.push(`SOUNDEX(\`${key}\`) = SOUNDEX(?)`);
        values.push(searchTerm);

        // 5. Ends with
        conditions.push(`LOWER(\`${key}\`) LIKE LOWER(?)`);
        values.push(`%${searchTerm}`);

        // Combine all conditions with OR
        whereClauses.push(`(${conditions.join(' OR ')})`);
    }

    private handleDateDiffOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new QueryError(`"dateDiff" operator requires an array of 2 values [date1, date2] for field "${key}"`, "D036");
        }
        const [date1, date2] = value;
        if (typeof date1 !== 'string' || typeof date2 !== 'string') {
            throw new QueryError(`"dateDiff" operator requires string values for field "${key}"`, "D036");
        }

        let date1Expr: string;
        let date2Expr: string;

        if (date1.toLowerCase() === 'now') {
            date1Expr = 'NOW()';
        } else {
            date1Expr = '?';
            values.push(date1);
        }

        if (date2.toLowerCase() === 'now') {
            date2Expr = 'NOW()';
        } else {
            date2Expr = '?';
            values.push(date2);
        }

        whereClauses.push(`DATEDIFF(${date1Expr}, ${date2Expr})`);
    }

    private handleModOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new QueryError(`"mod" operator requires an array of 2 numbers [divisor, remainder] for field "${key}"`, "D036");
        }
        if (typeof value[0] !== 'number' || typeof value[1] !== 'number') {
            throw new QueryError(`"mod" operator requires number values for field "${key}"`, "D036");
        }
        if (value[0] <= 0) {
            throw new QueryError(`"mod" divisor must be greater than 0 for field "${key}"`, "D036");
        }
        whereClauses.push(`MOD(\`${key}\`, ?) = ?`);
        values.push(value[0], value[1]);
    }

    private handleElemMatch(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new QueryError(`"elemMatch" operator requires an object value for field "${key}"`, "D036");
        }
        if (Object.keys(value).length === 0) {
            throw new QueryError(`"elemMatch" operator requires at least one condition for field "${key}"`, "D036");
        }

        const elemConditions: string[] = [];
        const elemValues: any[] = [];

        for (const [field, val] of Object.entries(value)) {
            if (typeof field !== 'string' || field === '') {
                throw new QueryError(`"elemMatch" field name must be a non-empty string for field "${key}"`, "D036");
            }
            if (val === undefined || val === null) {
                throw new QueryError(`"elemMatch" condition for "${field}" cannot be null or undefined for field "${key}"`, "D036");
            }

            if (typeof val === 'object' && !Array.isArray(val)) {
                for (const [op, opVal] of Object.entries(val)) {
                    if (opVal === undefined || opVal === null) {
                        throw new QueryError(`"elemMatch" operator "${op}" value cannot be null or undefined for field "${key}.${field}"`, "D036");
                    }
                    switch (op) {
                        case 'gt':
                            if (typeof opVal !== 'number') throw new QueryError(`"gt" operator requires a number value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') > ?`);
                            elemValues.push(opVal);
                            break;
                        case 'gte':
                            if (typeof opVal !== 'number') throw new QueryError(`"gte" operator requires a number value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') >= ?`);
                            elemValues.push(opVal);
                            break;
                        case 'lt':
                            if (typeof opVal !== 'number') throw new QueryError(`"lt" operator requires a number value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') < ?`);
                            elemValues.push(opVal);
                            break;
                        case 'lte':
                            if (typeof opVal !== 'number') throw new QueryError(`"lte" operator requires a number value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') <= ?`);
                            elemValues.push(opVal);
                            break;
                        case 'ne':
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') != ?`);
                            elemValues.push(opVal);
                            break;
                        case 'eq':
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') = ?`);
                            elemValues.push(opVal);
                            break;
                        case 'startsWith':
                            if (typeof opVal !== 'string') throw new QueryError(`"startsWith" operator requires a string value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') like ?`);
                            elemValues.push(`${opVal}%`);
                            break;
                        case 'endsWith':
                            if (typeof opVal !== 'string') throw new QueryError(`"endsWith" operator requires a string value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') like ?`);
                            elemValues.push(`%${opVal}`);
                            break;
                        case 'contains':
                            if (typeof opVal !== 'string') throw new QueryError(`"contains" operator requires a string value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') like ?`);
                            elemValues.push(`%${opVal}%`);
                            break;
                        case 'regex':
                            if (typeof opVal !== 'string') throw new QueryError(`"regex" operator requires a string value for field "${key}.${field}"`, "D036");
                            elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') regexp ?`);
                            elemValues.push(opVal);
                            break;
                        default:
                            throw new QueryError(`Invalid operator "${op}" for elemMatch on field "${key}.${field}"`, "D036");
                    }
                }
            } else {
                elemConditions.push(`JSON_EXTRACT(\`${key}\`, '$[*].${field}') = ?`);
                elemValues.push(val);
            }
        }

        whereClauses.push(`(${elemConditions.join(' AND ')})`);
        values.push(...elemValues);
    }

    private handleSizeOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        let operator = '=';
        let sizeValue = value;

        if (typeof value === 'object' && value !== null) {
            let opCount = 0;
            for (const [op, opValue] of Object.entries(value)) {
                opCount++;
                if (opCount > 1) {
                    throw new QueryError(`"size" cannot have multiple operators on field "${key}"`, "D036");
                }
                if (opValue === undefined || opValue === null) {
                    throw new QueryError(`"size" operator value cannot be null or undefined for field "${key}"`, "D036");
                }
                if (typeof opValue !== 'number') {
                    throw new QueryError(`"size" ${op} operator requires a number value for field "${key}"`, "D036");
                }
                if (opValue < 0) {
                    throw new QueryError(`"size" operator requires a non-negative number for field "${key}"`, "D036");
                }
                switch (op) {
                    case 'gt': operator = '>'; break;
                    case 'gte': operator = '>='; break;
                    case 'lt': operator = '<'; break;
                    case 'lte': operator = '<='; break;
                    case 'ne': operator = '!='; break;
                    default: throw new QueryError(`Invalid operator "${op}" for size on field "${key}"`, "D036");
                }
                sizeValue = opValue;
            }
        } else {
            if (value === undefined || value === null) {
                throw new QueryError(`"size" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
            if (typeof value !== 'number') {
                throw new QueryError(`"size" operator requires a number value for field "${key}"`, "D036");
            }
            if (value < 0) {
                throw new QueryError(`"size" operator requires a non-negative number for field "${key}"`, "D036");
            }
            sizeValue = value;
        }

        whereClauses.push(`JSON_LENGTH(\`${key}\`) ${operator} ?`);
        values.push(sizeValue);
    }

    private handleAllOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (!Array.isArray(value)) {
            throw new QueryError(`"all" operator requires an array value for field "${key}"`, "D036");
        }
        if (value.length === 0) {
            throw new QueryError(`"all" operator requires a non-empty array for field "${key}"`, "D036");
        }
        const allConditions: string[] = [];
        for (const item of value) {
            if (item === undefined || item === null) {
                throw new QueryError(`"all" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
            if (typeof item !== 'string') {
                throw new QueryError(`"all" operator values must be strings for field "${key}"`, "D036");
            }
            allConditions.push(`\`${key}\` like ?`);
            values.push(`%${item}%`);
        }
        whereClauses.push(`(${allConditions.join(' AND ')})`);
    }

    private handleNinOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (!Array.isArray(value)) {
            throw new QueryError(`"nin" operator requires an array value for field "${key}"`, "D036");
        }
        if (value.length === 0) {
            throw new QueryError(`"nin" operator requires a non-empty array for field "${key}"`, "D036");
        }
        for (const item of value) {
            if (item === undefined || item === null) {
                throw new QueryError(`"nin" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
        }
        const placeholders = value.map(() => "?").join(", ");
        whereClauses.push(`\`${key}\` not in (${placeholders})`);
        values.push(...value);
    }

    private handleExistsOperator(key: string, value: any, whereClauses: string[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"exists" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'boolean') {
            throw new QueryError(`"exists" operator requires a boolean value for field "${key}"`, "D036");
        }
        whereClauses.push(value === true ? `\`${key}\` is not null` : `\`${key}\` is null`);
    }

    private handleIsNullOperator(key: string, value: any, whereClauses: string[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"isNull" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'boolean') {
            throw new QueryError(`"isNull" operator requires a boolean value for field "${key}"`, "D036");
        }
        whereClauses.push(value === true ? `\`${key}\` is null` : `\`${key}\` is not null`);
    }

    private handleRegexOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"regex" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"regex" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"regex" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` regexp ?`);
        values.push(value);
    }

    private handleStartsWithOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"startsWith" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"startsWith" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"startsWith" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` like ?`);
        values.push(`${value}%`);
    }

    private handleEndsWithOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"endsWith" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"endsWith" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"endsWith" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` like ?`);
        values.push(`%${value}`);
    }

    private handleContainsOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (value === undefined || value === null) {
            throw new QueryError(`"contains" operator value cannot be null or undefined for field "${key}"`, "D036");
        }
        if (typeof value !== 'string') {
            throw new QueryError(`"contains" operator requires a string value for field "${key}"`, "D036");
        }
        if (value === '') {
            throw new QueryError(`"contains" operator requires a non-empty string for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` like ?`);
        values.push(`%${value}%`);
    }

    private handleNthContainOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (Object.keys(value).length === 0) {
            throw new QueryError(`"nthContain" operator requires at least one condition for field "${key}"`, "D036");
        }

        const posMap: Record<string, number> = {
            "first": 1,
            "second": 2,
            "third": 3,
            "fourth": 4,
            "fifth": 5
        };

        for (const [position, positionValue] of Object.entries(value)) {
            let pos: number;

            if (posMap[position]) {
                pos = posMap[position];
            } else {
                pos = parseInt(position);
            }

            if (isNaN(pos) || pos < 1) {
                throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
            }

            if (positionValue === undefined || positionValue === null) {
                throw new QueryError(`"nthContain" value cannot be null or undefined at position "${position}" for field "${key}"`, "D036");
            }

            const prefix = "_".repeat(pos - 1);

            if (Array.isArray(positionValue) && positionValue.length > 0) {
                const orClauses: string[] = [];
                for (const val of positionValue) {
                    if (val === undefined || val === null) {
                        throw new QueryError(`"nthContain" value cannot be null or undefined at position "${position}" for field "${key}"`, "D036");
                    }
                    if (typeof val !== 'string') {
                        throw new QueryError(`"nthContain" values must be strings for field "${key}"`, "D036");
                    }
                    orClauses.push(`\`${key}\` like ?`);
                    values.push(`${prefix}${val}%`);
                }
                whereClauses.push(`(${orClauses.join(' or ')})`);
            } else if (typeof positionValue === "string") {
                if (positionValue === '') {
                    throw new QueryError(`"nthContain" requires a non-empty string at position "${position}" for field "${key}"`, "D036");
                }
                whereClauses.push(`\`${key}\` like ?`);
                values.push(`${prefix}${positionValue}%`);
            } else {
                throw new QueryError(`Invalid value for nthContain at position "${position}"`, "D036");
            }
        }
    }

    private handleBetweenOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new QueryError(`"between" operator requires an array of 2 values for field "${key}"`, "D036");
        }
        if (value[0] === undefined || value[0] === null || value[1] === undefined || value[1] === null) {
            throw new QueryError(`"between" operator values cannot be null or undefined for field "${key}"`, "D036");
        }
        whereClauses.push(`\`${key}\` between ? and ?`);
        values.push(value[0], value[1]);
    }

    private handleInOperator(key: string, value: any, whereClauses: string[], values: any[]): void {
        if (!Array.isArray(value)) {
            throw new QueryError(`"in" operator requires an array value for field "${key}"`, "D036");
        }
        if (value.length === 0) {
            throw new QueryError(`"in" operator requires a non-empty array value for field "${key}"`, "D036");
        }
        for (const item of value) {
            if (item === undefined || item === null) {
                throw new QueryError(`"in" operator value cannot be null or undefined for field "${key}"`, "D036");
            }
        }
        const placeholders = value.map(() => "?").join(", ");
        whereClauses.push(`\`${key}\` in (${placeholders})`);
        values.push(...value);
    }

    // ==================== EXPR BUILDER ====================

    private buildExprSQL(expr: any): { sql: string; values: any[] } {
        const values: any[] = [];

        if (expr === undefined || expr === null) {
            throw new QueryError("Expr cannot be null or undefined", "D036");
        }

        if (typeof expr === 'string' && expr.startsWith('#')) {
            const fieldName = expr.substring(1);
            if (fieldName === '') {
                throw new QueryError("Field reference cannot be empty (# must be followed by a field name)", "D036");
            }
            if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fieldName)) {
                throw new QueryError(`Invalid field name "${fieldName}" in expr`, "D036");
            }
            return { sql: `\`${fieldName}\``, values: [] };
        }

        if (typeof expr !== 'object' || Array.isArray(expr)) {
            if (typeof expr === 'string' && expr === '') {
                throw new QueryError("Expr string value cannot be empty", "D036");
            }
            return { sql: '?', values: [expr] };
        }

        const keys = Object.keys(expr);
        if (keys.length === 0) {
            throw new QueryError("Expr object cannot be empty", "D036");
        }
        if (keys.length > 1) {
            throw new QueryError(`Expr object cannot have multiple keys: ${keys.join(', ')}`, "D036");
        }

        const op = keys[0];
        const operand = expr[op];

        if (operand === undefined || operand === null) {
            throw new QueryError(`Operator "${op}" in expr requires a value`, "D036");
        }

        switch (op) {
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            case 'ne':
            case 'eq': {
                if (!Array.isArray(operand) || operand.length !== 2) {
                    throw new QueryError(`"${op}" operator in expr requires an array of 2 values`, "D036");
                }
                if (operand[0] === undefined || operand[0] === null || operand[1] === undefined || operand[1] === null) {
                    throw new QueryError(`"${op}" operator in expr cannot have null/undefined values`, "D036");
                }
                const left = this.buildExprSQL(operand[0]);
                const right = this.buildExprSQL(operand[1]);
                const operatorMap: Record<string, string> = {
                    'gt': '>',
                    'gte': '>=',
                    'lt': '<',
                    'lte': '<=',
                    'ne': '!=',
                    'eq': '='
                };
                return {
                    sql: `${left.sql} ${operatorMap[op]} ${right.sql}`,
                    values: [...left.values, ...right.values]
                };
            }
            case 'add':
            case 'multiply': {
                if (!Array.isArray(operand)) {
                    throw new QueryError(`"${op}" operator in expr requires an array of values`, "D036");
                }
                if (operand.length < 2) {
                    throw new QueryError(`"${op}" operator in expr requires at least 2 values`, "D036");
                }
                for (const item of operand) {
                    if (item === undefined || item === null) {
                        throw new QueryError(`"${op}" operator in expr cannot have null/undefined values`, "D036");
                    }
                }
                const parts: string[] = [];
                const allValues: any[] = [];
                for (const item of operand) {
                    const result = this.buildExprSQL(item);
                    parts.push(result.sql);
                    allValues.push(...result.values);
                }
                const operatorSymbol = op === 'add' ? ' + ' : ' * ';
                return { sql: parts.join(operatorSymbol), values: allValues };
            }
            case 'subtract':
            case 'divide': {
                if (!Array.isArray(operand) || operand.length !== 2) {
                    throw new QueryError(`"${op}" operator in expr requires an array of 2 values`, "D036");
                }
                if (operand[0] === undefined || operand[0] === null || operand[1] === undefined || operand[1] === null) {
                    throw new QueryError(`"${op}" operator in expr cannot have null/undefined values`, "D036");
                }
                const left = this.buildExprSQL(operand[0]);
                const right = this.buildExprSQL(operand[1]);
                const operatorSymbol = op === 'subtract' ? ' - ' : ' / ';
                return {
                    sql: `${left.sql} ${operatorSymbol} ${right.sql}`,
                    values: [...left.values, ...right.values]
                };
            }
            default:
                throw new QueryError(`Unknown operator "${op}" in expr`, "D036");
        }
    }
}