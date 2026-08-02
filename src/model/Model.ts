import { Schema } from "../schema";
import { Document } from "./Document";
import { ModelError, SchemaError } from "../exceptions";
import { MisMatchError } from "../exceptions/MisMatchError";
import type { Driver } from "../interfaces/Driver";
import type { Query } from "../types/query";

export class Model {
    private readonly name: string;
    private readonly Schema: Schema;
    private driver: Driver;

    constructor(name: string, Schema: Schema, driver: Driver) {
        this.name = name;
        this.Schema = Schema;
        this.driver = driver;
    }

    public async create(data: Record<string, unknown>): Promise<Document> {
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

        const createQuery: Query = {
            operation: "create",
            type: "object",
            data: {
                name: this.name,
                data
            }
        }

        await this.driver.query(createQuery);

        return new Document(data);
    }

    public async find(where?: Record<string, unknown>): Promise<Document[]> {
        // example usage
        /**
        const db = await DataBridge.connect({
            provider: "postgres",
            url: "postgres://user:password@localhost:5432/database"
        });

        const User = await db.model(
            "User",
            new Schema({
                name: String,
                email: String,
                age: Number
            })
        );

        await User.create({
            name: "John",
            email: "john@example.com",
            age: 21
        });

         // returns all the users
        await User.find();

         // get the user with name John
         await User.find({ name: "John" });

         // get all users with age >= 21
         await User.find({
        age : {
            gte: 21
        }
        })
         **/

        const findQuery: Query = {
            operation: "find",
            type: "document",
            data: {
                name: this.name,
                where
            }
        }

        const result: Document[] = await this.driver.query(findQuery);
        return result as Document[];
    }

    public static async make(Schema: Schema, driver: Driver, name: string) {
        if (!Schema) {
            throw new SchemaError(`Schema is missing or is of wrong type","D045");`)
        }

        if (!name) {
            throw new SchemaError("Model name is missing", "D045");
        }

        const modelQuery: Query = {
            operation: "create",
            type: "model",
            data: {
                name: name,
                Schema: Schema,
            }
        }
        await driver.query(modelQuery);
    }
}