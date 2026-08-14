import { Schema } from "../schema";
import { Document } from "./Document";
import { ModelError, SchemaError, MisMatchError } from "../exceptions";
import type { Driver } from "../interfaces/Driver";
import type { Query } from "../types/query";
import type { Model as MDL } from "../interfaces/Model";

/**
 * Model class representing a database table/collection
 * Handles CRUD operations and data validation for a specific model
 */
export class Model implements MDL {
    private readonly name: string;
    private readonly Schema: Schema;
    private driver: Driver;

    constructor(name: string, Schema: Schema, driver: Driver) {
        this.name = name;
        this.Schema = Schema;
        this.driver = driver;
    }

    public getName(): string {
        return this.name;
    }

    public getSchema(): Schema {
        return this.Schema;
    }

    /**
     * Creates a new document/record in the database
     * @param data - The data to insert, must match the schema
     * @returns The created document
     * @throws {ModelError} If schema validation fails
     * @throws {MisMatchError} If data doesn't match schema
     */
    public async create(data: Record<string, unknown>): Promise<Document> {
        // Check all schema fields exist in the data
        if (!this.Schema.fields.every(field => data.hasOwnProperty(field.field))) {
            throw new ModelError("The model definition is invalid or malformed", "D052");
        }

        // Check there are no extra fields not defined in schema
        const schemaKeys = this.Schema.fields.map(field => field.field).sort();
        const dataKeys = Object.keys(data).sort();

        if (schemaKeys.length !== dataKeys.length || !schemaKeys.every((key, i) => key === dataKeys[i])) {
            throw new MisMatchError("Document fields do not match the schema");
        }

        // Validate each field's type against the schema definition
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
                    if (
                        typeof value !== "object" ||
                        value === null ||
                        Array.isArray(value)
                    ) {
                        throw new MisMatchError(`Field "${field.field}" must be an object`);
                    }
                    break;

                case "ARRAY":
                    if (!Array.isArray(value)) {
                        throw new MisMatchError(`Field "${field.field}" must be an array`);
                    }
                    break;

                default:
                    break;
            }
        }

        // Build and execute the create query
        const createQuery: Query = {
            operation: "create",
            type: "object",
            data: {
                name: this.name,
                data
            }
        };

        await this.driver.query(this, createQuery);

        return new Document(data);
    }

    /**
     * Finds documents/records in the database
     * @param where - Optional filter conditions
     * @returns Array of documents matching the conditions
     *
     * @example
     * // Get all users
     * await User.find();
     *
     * // Get user with name "John"
     * await User.find({ name: "John" });
     *
     * // Get users with age >= 21
     * await User.find({ age: { gte: 21 } });
     */
    public async find(where?: Record<string, unknown>): Promise<Document[]> {
        const findQuery: Query = {
            operation: "find",
            type: "document",
            data: {
                name: this.name,
                where
            }
        };

        return await this.driver.query(this, findQuery);
    }

    public async findOne(where?: Record<string, unknown>): Promise<Document | null> {
        const findOneQuery: Query = {
            operation: "findOne",
            type: "document",
            data: {
                name: this.name,
                where
            }
        };

        return await this.driver.query(this, findOneQuery);
    }

    /**
     * updates a record/records in the database
     *
     * @param where - filter conditions for the documents to update
     * @param options - optional additional things for the update
     * @returns null or an array of the updated documents
     *
     * @example
     * //update the salary of an employee named John and get nothing back
     * await Employees.update({
     *     name: John,
     *     set: {
     *         salary: 15000
     *     }
     * });
     *
     * //update the salary and bonus of employees not named John and age above 50 and get their record
     * await Employees.update({
     *     name: {
     *         not: John
     *     },
     *     age: {
     *         gte: 50
     *     },
     *     set: {
     *         salary: 15000,
     *         bonus: 25000
     *     }
     * }, return all)
     */

    public async update(where: Record<string, unknown>, options?: unknown): Promise<Document[] | null> {
        const updateQuery: Query = {
            operation: "update",
            type: "document",
            data: {
                name: this.name,
                where,
                options
            }
        }

        return await this.driver.query(this, updateQuery);
    }

    /**
     * Creates the database table/collection for this model
     * @param Schema - The schema definition
     * @param driver - The database driver instance
     * @param name - The name of the model/table
     * @throws {SchemaError} If schema or name is invalid
     */
    public static async make(
        Schema: Schema,
        driver: Driver,
        name: string
    ): Promise<void> {
        if (!Schema) {
            throw new SchemaError("Schema is missing or is of wrong type", "D045");
        }

        if (!name) {
            throw new SchemaError("Model name is missing", "D045");
        }

        const modelQuery: Query = {
            operation: "create",
            type: "model",
            data: {
                name,
                Schema
            }
        };

        await driver.query(null, modelQuery);
    }
}