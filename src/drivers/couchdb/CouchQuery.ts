import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import { ModelError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getCouchType } from "./Types";
import { Schema } from "../../schema";

/**
 * CouchDB query handler class
 * Translates DataBridge queries into CouchDB operations
 */
export default class CouchQuery extends BaseQuery {
    protected connection: any;
    private databaseName: string;

    constructor(query: Query, db: unknown) {
        super(query);
        this.connection = db;
        this.databaseName = "";
        this.fields = {};
    }

    protected mapType(type: string): any {
        return getCouchType(type);
    }

    private validateDataAgainstSchema(data: Record<string, unknown>, schema: Schema) {
        // Check all schema fields exist in the data
        for (const field of schema.fields) {
            if (!data.hasOwnProperty(field.field)) {
                throw new ModelError(`Missing required field: "${field.field}"`, "D052");
            }
        }

        // Check there are no extra fields
        const schemaKeys = schema.fields.map(f => f.field);
        const dataKeys = Object.keys(data);

        for (const key of dataKeys) {
            if (key !== 'type' && !schemaKeys.includes(key)) {
                throw new ModelError(`Extra field "${key}" not defined in schema`, "D052");
            }
        }

        // Check types
        for (const field of schema.fields) {
            const value = data[field.field];

            switch (field.type) {
                case "STRING":
                    if (typeof value !== "string") {
                        throw new ModelError(`Field "${field.field}" must be a string`, "D053");
                    }
                    break;
                case "NUMBER":
                    if (typeof value !== "number") {
                        throw new ModelError(`Field "${field.field}" must be a number`, "D053");
                    }
                    break;
                case "BOOLEAN":
                    if (typeof value !== "boolean") {
                        throw new ModelError(`Field "${field.field}" must be a boolean`, "D053");
                    }
                    break;
                case "DATE":
                    if (!(value instanceof Date) && typeof value !== "string") {
                        throw new ModelError(`Field "${field.field}" must be a Date or string`, "D053");
                    }
                    break;
                case "OBJECT":
                    if (typeof value !== "object" || value === null || Array.isArray(value)) {
                        throw new ModelError(`Field "${field.field}" must be an object`, "D053");
                    }
                    break;
                case "ARRAY":
                    if (!Array.isArray(value)) {
                        throw new ModelError(`Field "${field.field}" must be an array`, "D053");
                    }
                    break;
                default:
                    break;
            }
        }
    }

    public async run(): Promise<any> {
        try {
            await this.read();
            const VALID_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

            if (!VALID_IDENTIFIER.test(this.data!.name as string)) {
                throw new ModelError("Invalid model name", "D056");
            }

            this.databaseName = (this.data!.name as string);

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            this.readSchema();
                            break;
                        case "object":
                            const row = this.data?.data as Record<string, unknown>;

                            // Validate data against schema
                            const schema = this.query.data?.Schema as Schema;
                            if (schema && schema instanceof Schema) {
                                this.validateDataAgainstSchema(row, schema);
                            }

                            const doc = {
                                ...row,
                                type: this.databaseName
                            };
                            await this.connection.insert(doc);
                            break;
                    }
                    break;
                case "find":
                    try {
                        if (!this.data?.where || Object.keys(this.data.where).length === 0) {
                            const result = await this.connection.list({ include_docs: true });
                            return result.rows.map((row: any) => row.doc);
                        }

                        // @ts-ignore
                        if (this.data.where.or && Array.isArray(this.data.where.or)) {
                            // @ts-ignore
                            const orConditions = this.data.where.or;
                            let selector: Record<string, any> = { $or: [] };

                            for (const condition of orConditions) {
                                const orCondition: Record<string, any> = {};
                                for (const [key, value] of Object.entries(condition)) {
                                    orCondition[key] = value;
                                }
                                selector.$or.push(orCondition);
                            }

                            const result = await this.connection.find({
                                selector: selector
                            });
                            return result.docs;
                        }

                        // Handle not operator
                        // @ts-ignore
                        if (this.data.where.not && typeof this.data.where.not === "object") {
                            // @ts-ignore
                            const notConditions = this.data.where.not;
                            let selector: Record<string, any> = {};

                            for (const [key, value] of Object.entries(notConditions)) {
                                selector[key] = { $ne: value };
                            }

                            const result = await this.connection.find({
                                selector: selector
                            });
                            return result.docs;
                        }

                        // Handle where clause with operators
                        const lookUps = Object.entries(this.data!.where);
                        let selector: Record<string, any> = {};

                        for (const [key, value] of lookUps) {
                            if (typeof value === "object" && value !== null) {
                                for (const [operator, opValue] of Object.entries(value)) {
                                    switch (operator) {
                                        case "gte":
                                            selector[key] = { $gte: opValue };
                                            break;
                                        case "gt":
                                            selector[key] = { $gt: opValue };
                                            break;
                                        case "lte":
                                            selector[key] = { $lte: opValue };
                                            break;
                                        case "lt":
                                            selector[key] = { $lt: opValue };
                                            break;
                                        case "ne":
                                            selector[key] = { $ne: opValue };
                                            break;
                                        default:
                                            selector[key] = opValue;
                                    }
                                }
                            } else {
                                selector[key] = value;
                            }
                        }

                        const result = await this.connection.find({
                            selector: selector
                        });
                        return result.docs;

                    } catch (error) {
                        if (error instanceof SchemaError) {
                            throw error;
                        }
                        throw new QueryError(`Failed to query database "${this.databaseName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
                    }
                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }
            throw new QueryError(`CouchDB query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}