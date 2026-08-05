import type { Query } from "../types/query";
import { QueryError, SchemaError, ModelError } from "../exceptions";
import { Schema } from "../schema";
import type { Model } from "../model";

/**
 * Base query handler class
 * Contains methods that are IDENTICAL across ALL database drivers
 */
export default abstract class BaseQuery {
    protected query: Query;
    protected data: Record<string, unknown> | undefined;
    protected operation: string | undefined;
    protected abstract connection: any;
    protected fields: Record<string, any> = {};
    protected tableName: string = "";

    protected constructor(query: Query) {
        this.query = query;
        this.operation = this.query.operation;
        this.fields = {};
    }

    /**
     * Map DataBridge type to database-specific type
     * MUST be implemented by each driver
     */
    protected abstract mapType(type: string): any;

    /**
     * Execute the query against the database
     * MUST be implemented by each driver
     */
    public abstract run(): Promise<any>;

    /**
     * Reads and validates the query
     * IDENTICAL for ALL databases
     */
    protected read(): void {
        if (!this.query.operation) {
            throw new QueryError("Operation not specified", "D035");
        }
        if (!this.query.type) {
            throw new QueryError("Type not specified", "D035");
        }
        this.data = this.query.data;
    }

    /**
     * Read schema from query data
     * IDENTICAL for ALL databases
     */
    protected readSchema(): void {
        if (!this.query.data?.hasOwnProperty("Schema") || !(this.query.data["Schema"] instanceof Schema)) {
            throw new SchemaError("The schema definition is invalid or malformed", "D040");
        }
        const schema = this.query.data["Schema"] as Schema;
        for (const field of schema.fields) {
            this.fields[field.field] = this.mapType(field.type);
        }
    }

    /**
     * Validate model name
     * IDENTICAL for ALL databases
     */
    protected validateModelName(): void {
        const VALID_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
        if (!VALID_IDENTIFIER.test(this.data!.name as string)) {
            throw new ModelError("Invalid model name", "D056");
        }
    }

    /**
     * Get table name from data
     * IDENTICAL for ALL databases
     */
    protected getTableName(): string {
        return (this.data!.name as string);
    }

    /**
     * Get where clause from data
     * IDENTICAL for ALL databases
     */
    protected getWhere(): any {
        return (this.data?.where as any) ?? {};
    }

    /**
     * Get field types from model schema
     * IDENTICAL for ALL SQL-based databases
     */
    protected getFieldTypes(model: Model | null): Record<string, string> {
        const schema = model?.getSchema();
        const fieldTypes: Record<string, string> = {};
        if (schema) {
            for (const field of schema.fields) {
                let rawType: string = field.type;
                if (typeof rawType === 'function') {
                    if (rawType === String) rawType = 'STRING';
                    else if (rawType === Number) rawType = 'NUMBER';
                    else if (rawType === Boolean) rawType = 'BOOLEAN';
                    else if (rawType === Date) rawType = 'DATE';
                    else if (rawType === Object) rawType = 'OBJECT';
                    else if (rawType === Array) rawType = 'ARRAY';
                    else if (rawType === Buffer) rawType = 'BUFFER';
                } else {
                    rawType = rawType.toUpperCase();
                }
                fieldTypes[field.field] = rawType;
            }
        }
        return fieldTypes;
    }

    /**
     * Sterilize database result back to JavaScript types
     * IDENTICAL for ALL SQL-based databases
     */
    protected sterilizeResult(result: any, model: Model | null): any {
        if (result === null || result === undefined) return result;

        if (Array.isArray(result)) {
            return result.map(item => this.sterilizeResult(item, model));
        }

        if (typeof result !== 'object') return result;

        const fieldTypes = this.getFieldTypes(model);
        const sterilized: Record<string, any> = {};

        for (const [key, value] of Object.entries(result)) {
            const fieldType = fieldTypes[key] || "";

            if (value === null || value === undefined) {
                sterilized[key] = value;
                continue;
            }

            if (fieldType === "BOOLEAN") {
                sterilized[key] = value === 1 || value === true || value === '1';
                continue;
            }

            if (fieldType === "DATE") {
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    sterilized[key] = new Date(value.replace(' ', 'T') + 'Z').toISOString();
                } else if (value instanceof Date) {
                    sterilized[key] = value.toISOString();
                } else {
                    sterilized[key] = value;
                }
                continue;
            }

            if (fieldType === "OBJECT" || fieldType === "JSON") {
                if (typeof value === 'string') {
                    try {
                        sterilized[key] = JSON.parse(value);
                    } catch {
                        sterilized[key] = value;
                    }
                } else {
                    sterilized[key] = value;
                }
                continue;
            }

            if (fieldType === "ARRAY") {
                if (typeof value === 'string') {
                    try {
                        sterilized[key] = JSON.parse(value);
                    } catch {
                        sterilized[key] = value;
                    }
                } else {
                    sterilized[key] = value;
                }
                continue;
            }

            if (fieldType === "BUFFER") {
                if (typeof value === 'string') {
                    sterilized[key] = {
                        type: "Buffer",
                        data: Array.from(Buffer.from(value, 'base64'))
                    };
                } else if (value instanceof Buffer) {
                    sterilized[key] = {
                        type: "Buffer",
                        data: Array.from(value)
                    };
                } else {
                    sterilized[key] = value;
                }
                continue;
            }

            if (fieldType === "NUMBER") {
                if (typeof value === 'string' && !isNaN(Number(value))) {
                    sterilized[key] = value.includes('.') ? value : Number(value);
                } else if (typeof value === 'number') {
                    sterilized[key] = value;
                } else {
                    sterilized[key] = value;
                }
                continue;
            }

            sterilized[key] = value;
        }

        return sterilized;
    }

    /**
     * Process row data for insert
     * IDENTICAL for ALL SQL-based databases
     */
    protected processRowData(row: Record<string, unknown>, model: Model | null): Record<string, any> {
        const fieldTypes = this.getFieldTypes(model);
        const processedRow: Record<string, any> = {};

        for (const [key, value] of Object.entries(row)) {
            const fieldType = fieldTypes[key] || "";

            if (value === undefined) continue;
            if (value === null) {
                processedRow[key] = null;
                continue;
            }

            if (fieldType === "BUFFER" && value instanceof Buffer) {
                processedRow[key] = value.toString('base64');
                continue;
            }

            if (fieldType === "DATE" && value instanceof Date) {
                processedRow[key] = value.toISOString().slice(0, 19).replace('T', ' ');
                continue;
            }

            if (fieldType === "BOOLEAN") {
                processedRow[key] = value ? 1 : 0;
                continue;
            }

            if (fieldType === "OBJECT" || fieldType === "JSON" || fieldType === "ARRAY") {
                if (typeof value === "object" && !(value instanceof Date)) {
                    processedRow[key] = JSON.stringify(value);
                } else {
                    processedRow[key] = value;
                }
                continue;
            }

            processedRow[key] = value;
        }

        return processedRow;
    }
}