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
                            // CouchDB doesn't have schema validation like SQL
                            // Just create the database if it doesn't exist
                            break;
                        case "object":
                            const row = this.data?.data as Record<string, unknown>;
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
                        if (!this.data?.where) {
                            const result = await this.connection.list({ include_docs: true });
                            return result.rows.map((row: any) => row.doc);
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

    private readSchema() {
        if (!this.query.data?.hasOwnProperty("Schema") || !(this.query.data["Schema"] instanceof Schema)) {
            throw new SchemaError("The schema definition is invalid or malformed", "D040");
        }

        const schema = this.query.data["Schema"] as Schema;

        for (const field of schema.fields) {
            this.fields[field.field] = this.mapType(field.type);
        }
    }
}