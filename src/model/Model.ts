import { Schema } from "../schema";
import { Document } from "./Document";
import { ModelError } from "../exceptions";
import { MisMatchError } from "../exceptions/MisMatchError";
import type { Driver } from "../interfaces/Driver";
import type { Query } from "../types/query";

/**
 * Model {
 *   name: 'User',
 *   schema: Schema {
 *     fields: [
 *       { field: 'name', type: 'STRING' },
 *       { field: 'email', type: 'STRING' },
 *       { field: 'age', type: 'NUMBER' }
 *     ]
 *   },
 *   create: [Function: create],
 *   find: [Function: find],
 *   findOne: [Function: findOne],
 *   update: [Function: update],
 *   delete: [Function: delete],
 *   query: [Function: query]
 * }
 */
export class Model {
    private readonly name: string;
    private Schema: Schema;
    private driver: Driver;

    constructor(name: string, Schema: Schema, driver: Driver) {
        this.name = name;
        this.Schema = Schema;
        this.driver = driver;
    }

    public create(data: Record<string, unknown>): Document {
        // Check all schema fields exist
        if (!this.Schema.fields.every(field => data.hasOwnProperty(field.field))) {
            throw new ModelError("The model definition is invalid or malformed","D052");
        }

        // Check there are no extra fields
        const schemaKeys = this.Schema.fields.map(field => field.field).sort();
        const dataKeys = Object.keys(data).sort();

        if (schemaKeys.length !== dataKeys.length || !schemaKeys.every((key, i) => key === dataKeys[i])) {
            throw new MisMatchError("Document fields do not match the schema");
        }

        // Check types
        for (const field of this.Schema.fields) {
            const value = data[field.field];

            switch (field.type) {
                case "STRING":
                    if (typeof value !== "string") {
                        throw new MisMatchError(`Field "${field.field}" must be a string`);
                    }
                    break;
                case "NUMBER":
                    if (typeof value !== "number") {
                        throw new MisMatchError(`Field "${field.field}" must be a number`);
                    }
                    break;
                case "BOOLEAN":
                    if (typeof value !== "boolean") {
                        throw new MisMatchError(`Field "${field.field}" must be a boolean`);
                    }
                    break;
                case "DATE":
                    if (!(value instanceof Date)) {
                        throw new MisMatchError(`Field "${field.field}" must be a Date`);
                    }
                    break;
                case "OBJECT":
                    if (typeof value !== "object" || value === null || Array.isArray(value)) {
                        throw new MisMatchError(`Field "${field.field}" must be an object`);
                    }
                    break;
                case "ARRAY":
                    if (!Array.isArray(value)) {
                        throw new MisMatchError(`Field "${field.field}" must be an array`);
                    }
                    break;
                // Add more type checks as needed
                default:
                    break;
            }
        }

        void this.make();

        return new Document(data);
    }

    public async make() {
        const query: Query = {
            operation: "create",
            type: "model",
            data: {
                name: this.name,
                Schema
            }
        }
        await this.driver.query(query)
    }
}