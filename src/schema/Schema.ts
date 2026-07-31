import { Field } from "./Field";
import { SchemaError } from "../exceptions";

export class Schema {
    private readonly definition: Record<string, unknown>;
    private fields: Field[];

    constructor (definition: Record<string, unknown>) {
        this.definition = definition;
        this.fields = [];
        this.run();
    }

    private run() {
        if (!this.definition || !Object.keys(this.definition).length) {
            throw new SchemaError("Schema definition invalid or malformed", "D040")
        }

        for (const [field, type] of Object.entries(this.definition)) {
            this.fields.push(new Field(field, type));
        }
    }
}