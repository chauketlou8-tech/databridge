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

                        // Handle top-level not operator
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
                            // Skip top-level special operators
                            if (key === 'or' || key === 'not' || key === 'between' || key === 'in') {
                                continue;
                            }

                            if (typeof value === "object" && value !== null) {
                                // Handle regex operator
                                if (value.regex !== undefined) {
                                    filter[key] = { $regex: value.regex };
                                    continue;
                                }

                                // Handle startsWith
                                if (value.startsWith !== undefined) {
                                    filter[key] = { $regex: `^${this.escapeRegex(value.startsWith)}` };
                                    continue;
                                }

                                // Handle endsWith
                                if (value.endsWith !== undefined) {
                                    filter[key] = { $regex: `${this.escapeRegex(value.endsWith)}$` };
                                    continue;
                                }

                                // Handle contains
                                if (value.contains !== undefined) {
                                    filter[key] = { $regex: this.escapeRegex(value.contains) };
                                    continue;
                                }

                                // Handle nthContain - specific position
                                if (value.nthContain && typeof value.nthContain === "object") {
                                    const nthConditions = value.nthContain;
                                    const orConditions: Record<string, any>[] = [];

                                    for (const [position, positionValue] of Object.entries(nthConditions)) {
                                        let pos: number;
                                        const posMap: Record<string, number> = {
                                            "first": 1,
                                            "second": 2,
                                            "third": 3,
                                            "fourth": 4,
                                            "fifth": 5
                                        };

                                        if (typeof position === "string" && posMap[position]) {
                                            pos = posMap[position];
                                        } else {
                                            pos = parseInt(position);
                                        }

                                        if (isNaN(pos) || pos < 1) {
                                            throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
                                        }

                                        if (Array.isArray(positionValue) && positionValue.length > 0) {
                                            for (const val of positionValue) {
                                                const pattern = this.buildPositionRegex(pos, val);
                                                orConditions.push({ [key]: { $regex: pattern } });
                                            }
                                        } else if (typeof positionValue === "string") {
                                            const pattern = this.buildPositionRegex(pos, positionValue);
                                            orConditions.push({ [key]: { $regex: pattern } });
                                        } else {
                                            throw new QueryError(`Invalid value for nthContain at position "${position}"`, "D036");
                                        }
                                    }

                                    if (orConditions.length > 0) {
                                        filter = { $or: orConditions };
                                    }
                                    continue;
                                }

                                // Handle between operator
                                if (value.between && Array.isArray(value.between) && value.between.length === 2) {
                                    filter[key] = { $gte: value.between[0], $lte: value.between[1] };
                                    continue;
                                }

                                // Handle in operator
                                if (value.in && Array.isArray(value.in) && value.in.length > 0) {
                                    filter[key] = { $in: value.in };
                                    continue;
                                }

                                // Handle nested not operator
                                if (value.not !== undefined) {
                                    filter[key] = { $ne: value.not };
                                    continue;
                                }

                                // Handle regular operators
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
                            } else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                                // Handle string values that look like regex patterns
                                filter[key] = { $regex: value };
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

                case "findOne":
                    try {
                        // Check if collection exists
                        const collections = await this.connection?.listCollections({ name: this.collectionName }).toArray();

                        if (!collections || collections.length === 0) {
                            throw new SchemaError(`Collection "${this.collectionName}" does not exist`, "D044");
                        }

                        let filter: Record<string, any> = {};

                        if (this.data?.where && Object.keys(this.data.where).length > 0) {
                            // Use the same query building logic as find but for a single document
                            // @ts-ignore
                            if (this.data.where.or && Array.isArray(this.data.where.or)) {
                                // @ts-ignore
                                const orConditions = this.data.where.or;
                                filter = { $or: [] };

                                for (const condition of orConditions) {
                                    const orCondition: Record<string, any> = {};
                                    for (const [key, value] of Object.entries(condition)) {
                                        orCondition[key] = value;
                                    }
                                    filter.$or.push(orCondition);
                                }
                            }
                                // Handle top-level not operator
                            // @ts-ignore
                            else if (this.data.where.not && typeof this.data.where.not === "object") {
                                // @ts-ignore
                                const notConditions = this.data.where.not;
                                filter = {};

                                for (const [key, value] of Object.entries(notConditions)) {
                                    filter[key] = { $ne: value };
                                }
                            }
                            // Handle regular where clause with operators
                            else {
                                const lookUps = Object.entries(this.data!.where);
                                filter = {};

                                for (const [key, value] of lookUps) {
                                    // Skip top-level special operators
                                    if (key === 'or' || key === 'not' || key === 'between' || key === 'in') {
                                        continue;
                                    }

                                    if (typeof value === "object" && value !== null) {
                                        // Handle regex operator
                                        if (value.regex !== undefined) {
                                            filter[key] = { $regex: value.regex };
                                            continue;
                                        }

                                        // Handle startsWith
                                        if (value.startsWith !== undefined) {
                                            filter[key] = { $regex: `^${this.escapeRegex(value.startsWith)}` };
                                            continue;
                                        }

                                        // Handle endsWith
                                        if (value.endsWith !== undefined) {
                                            filter[key] = { $regex: `${this.escapeRegex(value.endsWith)}$` };
                                            continue;
                                        }

                                        // Handle contains
                                        if (value.contains !== undefined) {
                                            filter[key] = { $regex: this.escapeRegex(value.contains) };
                                            continue;
                                        }

                                        // Handle nthContain
                                        if (value.nthContain && typeof value.nthContain === "object") {
                                            const nthConditions = value.nthContain;
                                            const orConditions: Record<string, any>[] = [];

                                            for (const [position, positionValue] of Object.entries(nthConditions)) {
                                                let pos: number;
                                                const posMap: Record<string, number> = {
                                                    "first": 1,
                                                    "second": 2,
                                                    "third": 3,
                                                    "fourth": 4,
                                                    "fifth": 5
                                                };

                                                if (typeof position === "string" && posMap[position]) {
                                                    pos = posMap[position];
                                                } else {
                                                    pos = parseInt(position);
                                                }

                                                if (isNaN(pos) || pos < 1) {
                                                    throw new QueryError(`Invalid position "${position}" for nthContain`, "D036");
                                                }

                                                if (Array.isArray(positionValue) && positionValue.length > 0) {
                                                    for (const val of positionValue) {
                                                        const pattern = this.buildPositionRegex(pos, val);
                                                        orConditions.push({ [key]: { $regex: pattern } });
                                                    }
                                                } else if (typeof positionValue === "string") {
                                                    const pattern = this.buildPositionRegex(pos, positionValue);
                                                    orConditions.push({ [key]: { $regex: pattern } });
                                                } else {
                                                    throw new QueryError(`Invalid value for nthContain at position "${position}"`, "D036");
                                                }
                                            }

                                            if (orConditions.length > 0) {
                                                filter = { $or: orConditions };
                                            }
                                            continue;
                                        }

                                        // Handle between operator
                                        if (value.between && Array.isArray(value.between) && value.between.length === 2) {
                                            filter[key] = { $gte: value.between[0], $lte: value.between[1] };
                                            continue;
                                        }

                                        // Handle in operator
                                        if (value.in && Array.isArray(value.in) && value.in.length > 0) {
                                            filter[key] = { $in: value.in };
                                            continue;
                                        }

                                        // Handle nested not operator
                                        if (value.not !== undefined) {
                                            filter[key] = { $ne: value.not };
                                            continue;
                                        }

                                        // Handle regular operators
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
                                    } else if (typeof value === "string" && /[.*+?^${}()|[\]\\]/.test(value)) {
                                        filter[key] = { $regex: value };
                                    } else {
                                        filter[key] = value;
                                    }
                                }
                            }
                        }

                        const result = await this.connection?.collection(this.collectionName).find(filter).limit(1).toArray();
                        return result && result.length > 0 ? result[0] : null;

                    } catch (error) {
                        if (error instanceof SchemaError) {
                            throw error;
                        }
                        throw new QueryError(`Failed to find one in collection "${this.collectionName}": ${error instanceof Error ? error.message : String(error)}`, "D031");
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

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private buildPositionRegex(position: number, value: string): string {
        const escapedValue = this.escapeRegex(value);
        return `^.{${position - 1}}${escapedValue}`;
    }
}