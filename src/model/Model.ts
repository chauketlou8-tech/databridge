import { Schema } from "../schema";
import { Document } from "./Document";
import { ModelError } from "../exceptions";
import { MisMatchError } from "../exceptions/MisMatchError";
import Driver from "../drivers/Driver";
import type { Query } from "../types/query";

/**
 * Model {
 *   name: 'User',
 *   schema: Schema {
 *     fields: [
 *       { name: 'name', type: 'STRING' },
 *       { name: 'email', type: 'STRING' },
 *       { name: 'age', type: 'NUMBER' }
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
    private name: string;
    private Schema: Schema;
    private driver: Driver;

    constructor(name: string, Schema: Schema, driver: Driver) {
        this.name = name;
        this.Schema = Schema;
        this.driver = driver;
        await this.make();
    }

    public create(data: Record<string, unknown>): Document {
        // Check all schema fields exist
        if (!this.Schema.fields.every(field => Object.hasOwn(data, field.name))) {
            throw new ModelError("The model definition is invalid or malformed","D052");
        }

        // Check there are no extra fields
        const schemaKeys = this.Schema.fields.map(field => field.name).sort();

        const dataKeys = Object.keys(data).sort();

        if (schemaKeys.length !== dataKeys.length || !schemaKeys.every((key, i) => key === dataKeys[i])) {
            throw new MisMatchError("Document fields do not match the schema");
        }

        // Check types
        for (const field of this.Schema.fields) {
            const value = data[field.name];

            if (field.type === String && typeof value !== "string") {
                throw new MisMatchError(`Field "${field.name}" must be a string`);
            }

            if (field.type === Number && typeof value !== "number") {
                throw new MisMatchError(`Field "${field.name}" must be a number`);
            }

            if (field.type === Boolean && typeof value !== "boolean") {
                throw new MisMatchError(`Field "${field.name}" must be a boolean`);
            }

            if (field.type === Date && !(value instanceof Date)) {
                throw new MisMatchError(`Field "${field.name}" must be a Date`);
            }
        }

        return new Document(data);
    }

    public async make() {
        const query: Query = {
            operation: "create model",
            data: {
                model: name,
                Schema
            }
        }
        await this.driver.query(query)
    }
}