import { normalizeType, VALID_TYPES } from "./Types";
import { SchemaError } from "../exceptions";

export class Field {
    field: string;
    type: string;

    constructor(field: string, type: unknown) {
        this.field = field;
        this.type = this.validateType(type);
    }

    private validateType(type: unknown): string {
        try {
            const normalized = normalizeType(type);

            if (!VALID_TYPES.includes(normalized as any)) {
                throw new SchemaError(`Invalid field type: "${normalized}" for field "${this.field}"`, "D040");
            }

            return normalized;
        }

        catch (error) {
            if (error instanceof SchemaError) {
                throw error;
            }

            throw new SchemaError(`Invalid type definition for field "${this.field}": ${error instanceof Error ? error.message : String(error)}`, "D040");
        }
    }
}