import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getBsonType } from "./Types";
import { Schema } from "../../schema";

/**
 * MongoDB query handler class
 * Translates DataBridge queries into MongoDB operations
 */
export default class MongoQuery extends BaseQuery {
    protected connection: any;
    private collectionName: string;

    constructor(query: Query, db: unknown) {
        super(query);
        this.connection = db;
        this.collectionName = "";
        this.fields = {};
    }

    /**
     * Map DataBridge type to MongoDB BSON type
     */
    protected mapType(type: string): { bsonType: string } {
        return {
            bsonType: getBsonType(type)
        };
    }

    /**
     * Executes the query against MongoDB
     * @throws {QueryError} If operation fails
     */
    public async run(): Promise<any> {
        try {
            await this.read();

            const VALID_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

            if (!VALID_IDENTIFIER.test(this.data!.name as string)) {
                throw new ModelError("Invalid model name", "D056");
            }

            this.collectionName = (this.data!.name as string);

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            this.readSchema();

                            this.fields["_id"] = { bsonType: "objectId" };
                            // Check if collection already exists
                            const collections = await this.connection?.listCollections({ name: this.collectionName }).toArray();

                            if (collections && collections.length > 0) {
                                throw new SchemaError(`Collection "${this.collectionName}" already exists`, "D043");
                            }

                            const schema = {
                                validator: {
                                    $jsonSchema: {
                                        bsonType: "object",
                                        properties: this.fields,
                                        additionalProperties: true
                                    }
                                }
                            };

                            await this.connection?.createCollection(this.collectionName, schema);
                            break;

                        case "object":
                            const row = this.data?.data as Record<string, unknown>;
                            await this.connection?.collection(this.collectionName).insertOne(row);
                            break;
                    }
                    break;

                case "find":
                    try {
                        // Check if collection exists
                        const collections = await this.connection?.listCollections({ name: this.collectionName }).toArray();

                        if (!collections || collections.length === 0) {
                            throw new SchemaError(`Collection "${this.collectionName}" does not exist`, "D044");
                        }

                        if (!this.data?.where) {
                            return await this.connection?.collection(this.collectionName).find({}).toArray();
                        }

                        // Handle where clause with operators
                        const lookUps = Object.entries(this.data!.where);
                        let filter: Record<string, any> = {};

                        for (const [key, value] of lookUps) {
                            if (typeof value === "object" && value !== null) {
                                for (const [operator, opValue] of Object.entries(value)) {
                                    switch (operator) {
                                        case "gte":
                                            filter[key] = { $gte: opValue };
                                            break;
                                        case "gt":
                                            filter[key] = { $gt: opValue };
                                            break;
                                        case "lte":
                                            filter[key] = { $lte: opValue };
                                            break;
                                        case "lt":
                                            filter[key] = { $lt: opValue };
                                            break;
                                        case "ne":
                                            filter[key] = { $ne: opValue };
                                            break;
                                        default:
                                            filter[key] = opValue;
                                    }
                                }
                            } else {
                                filter[key] = value;
                            }
                        }

                        const docs = await this.connection?.collection(this.collectionName).find(filter).toArray();
                        return docs;

                    } catch (error) {
                        if (error instanceof SchemaError) {
                            throw error;
                        }
                        throw new QueryError(`Failed to query collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
                    }

                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            // Re-throw if it's already a DataBridge error
            if (error instanceof QueryError || error instanceof SchemaError || error instanceof ModelError) {
                throw error;
            }
            // Wrap unknown errors
            throw new QueryError(`MongoDB query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }

    private readSchema() {
        // Validate schema
        if (!this.query.data?.hasOwnProperty("Schema") || !(this.query.data["Schema"] instanceof Schema)) {
            throw new SchemaError("The schema definition is invalid or malformed", "D040");
        }

        // Build database schema from DataBridge schema
        const schema = this.query.data["Schema"] as Schema;

        for (const field of schema.fields) {
            this.fields[field.field] = this.mapType(field.type);
        }
    }
}