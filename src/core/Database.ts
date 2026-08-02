import type { Database as DB } from "../interfaces/Database";
import { Driver } from "../interfaces/Driver";
import { Model, ModelFactory } from "../model";
import { Schema } from "../schema"

/**
 * Database class representing a connected database instance
 * Provides methods for model creation and connection management
 *
 * @example
 * const db = await DataBridge.connect({
 *     provider: "postgres",
 *     url: "postgres://localhost:5432/myapp"
 * });
 *
 * const User = await db.model("User", new Schema({
 *     name: String,
 *     email: String
 * }));
 */
export default class Database implements DB {
    private readonly driver: Driver;

    constructor(driver: Driver) {
        this.driver = driver;
    }

    /**
     * Creates a new model and its corresponding database table/collection
     *
     * @param name - The name of the model/table
     * @param Schema - The schema definition for the model
     * @returns A Model instance for CRUD operations
     *
     * @example
     * const User = await db.model("User", new Schema({
     *     name: String,
     *     email: String,
     *     age: Number
     * }));
     */
    public async model(name: string, Schema: Schema): Promise<Model> {
        await Model.make(Schema, this.driver, name)
        return ModelFactory.createModel(name, Schema, this.driver);
    }

    /**
     * Closes the database connection
     *
     * @example
     * await db.close();
     */
    public async close(): Promise<void> {
        return await this.driver.disconnect();
    }

    /**
     * Returns the underlying driver instance
     * Useful for direct database access if needed
     */
    getDriver(): Driver {
        return this.driver;
    }
}