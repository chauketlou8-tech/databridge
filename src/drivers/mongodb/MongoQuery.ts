import type { Query } from "../../types/query";
import { QueryError, SchemaError } from "../../exceptions";
import BaseQuery from "../../utils/BaseQuery";
import { getBsonType } from "./Types";

/**
 * MongoDB query handler class
 * Translates DataBridge queries into MongoDB operations
 */
export default class MongoQuery extends BaseQuery {
    protected connection: any;

    constructor(query: Query, db: unknown) {
        super(query);
        this.connection = db;
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
    public async run(): Promise<void> {
        try {
            await this.read();

            switch (this.operation) {
                case "create":
                    switch (this.query.type) {
                        case "model":
                            // Check if collection already exists
                            const collections = await this.connection?.listCollections({ name: this.data?.name }).toArray();

                            if (collections && collections.length > 0) {
                                throw new SchemaError(`Collection "${this.data?.name}" already exists`, "D043");
                            }

                            const schema = {
                                validator: {
                                    $jsonSchema: {
                                        bsonType: "object",
                                        properties: this.fields
                                    }
                                }
                            };

                            await this.connection?.createCollection(this.data?.name, schema);
                            break;
                    }
                    break;
                default:
                    throw new QueryError(`Operation "${this.operation}" not implemented`, "D036");
            }
        } catch (error) {
            // Re-throw if it's already a DataBridge error
            if (error instanceof QueryError || error instanceof SchemaError) {
                throw error;
            }
            // Wrap unknown errors
            throw new QueryError(`MongoDB query failed: ${error instanceof Error ? error.message : String(error)}`, "D031");
        }
    }
}