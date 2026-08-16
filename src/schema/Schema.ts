import { Field } from "./Field";
import { SchemaError } from "../exceptions";

/**
 * Schema class that defines the structure of a model
 * Validates field definitions and stores them
 */
export class Schema {
    private readonly definition: Record<string, unknown>;
    fields: Field[];

    constructor (definition: Record<string, unknown>) {
        this.definition = definition;
        this.fields = [];
        this.run();
    }

    /**
     * Validates the schema definition and creates Field instances
     * @throws {SchemaError} If schema definition is empty or invalid
     */
    private run() {
        // Check if schema definition exists and has fields
        if (!this.definition || typeof this.definition !== "object" || !Object.keys(this.definition).length) {
            throw new SchemaError("Schema definition invalid or malformed", "D040")
        }

        // Create Field instances for each field in the schema
        for (const [field, type] of Object.entries(this.definition)) {
            this.fields.push(new Field(field, type));
        }
    }
}