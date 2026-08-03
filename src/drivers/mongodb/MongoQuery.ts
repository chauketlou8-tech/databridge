import type { Query } from "../../types/query";
import { ModelError, QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../BaseQuery";
import { getBsonType } from "./Types";

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

                        if (!this.data?.where || Object.keys(this.data.where).length === 0) {
                            return await this.connection?.collection(this.collectionName).find({}).toArray();
                        }

                        // @ts-ignore
                        if (this.data.where.or && Array.isArray(this.data.where.or)) {
                            // @ts-ignore
                            const orConditions = this.data.where.or;
                            let filter: Record<string, any> = { $or: [] };

                            for (const condition of orConditions) {
                                const orCondition: Record<string, any> = {};
                                for (const [key, value] of Object.entries(condition)) {
                                    orCondition[key] = value;
                                }
                                filter.$or.push(orCondition);
                            }

                            return await this.connection?.collection(this.collectionName).find(filter).toArray();
                        }

                        // Handle not operator
                        // @ts-ignore
                        if (this.data.where.not && typeof this.data.where.not === "object") {
                            // @ts-ignore
                            const notConditions = this.data.where.not;
                            let filter: Record<string, any> = {};

                            for (const [key, value] of Object.entries(notConditions)) {
                                filter[key] = { $ne: value };
                            }

                            return await this.connection?.collection(this.collectionName).find(filter).toArray();
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

                        return await this.connection?.collection(this.collectionName).find(filter).toArray();

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
}