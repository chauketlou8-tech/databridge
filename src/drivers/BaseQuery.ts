import type { Query } from "../types/query";
import {QueryError, SchemaError} from "../exceptions";
import {Schema} from "../schema";

/**
 * Base query handler class
 * Provides common validation and reading logic for all database queries
 */
export default abstract class BaseQuery {
    protected query: Query;
    protected data: Record<string, unknown> | undefined;
    protected operation: string | undefined;
    protected abstract connection: any;
    protected fields: Record<string, any> = {};

    protected constructor(query: Query) {
        this.query = query;
        this.operation = this.query.operation;
        this.fields = {};
    }

    /**
     * Reads and validates the query
     * @throws {QueryError} If operation or type is not specified
     * @throws {SchemaError} If schema definition is invalid
     */
    protected async read(): Promise<void> {
        // Validate operation
        if (!this.query.operation) {
            throw new QueryError("Operation not specified", "D035");
        }

        // Validate type
        if (!this.query.type) {
            throw new QueryError("Type not specified", "D035");
        }

        this.data = this.query.data;
    }

    protected readSchema() {
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

    /**
     * Map DataBridge type to database-specific type
     * Must be implemented by each database driver
     */
    protected abstract mapType(type: string): any;

    /**
     * Execute the query against the database
     * Must be implemented by each database driver
     */
    public abstract run(): Promise<void>;
}