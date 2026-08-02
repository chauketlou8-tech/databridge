import type { Query } from "../types/query";
import { QueryError } from "../exceptions";

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