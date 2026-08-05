import { SchemaError } from "../exceptions";

/**
 * DataBridge supported data types
 * These map directly to the types defined in types.bridge
 */
export enum Types {
    // Uppercase
    STRING = "STRING",
    NUMBER = "NUMBER",
    BOOLEAN = "BOOLEAN",
    DATE = "DATE",
    OBJECT = "OBJECT",
    ARRAY = "ARRAY",
    BUFFER = "BUFFER",
    UUID = "UUID",
    DECIMAL = "DECIMAL",
    ENUM = "ENUM",
    JSON = "JSON",
    TEXT = "TEXT",

    // Lowercase (same values)
    string = "STRING",
    number = "NUMBER",
    boolean = "BOOLEAN",
    date = "DATE",
    object = "OBJECT",
    array = "ARRAY",
    buffer = "BUFFER",
    uuid = "UUID",
    decimal = "DECIMAL",
    enum = "ENUM",
    json = "JSON",
    text = "TEXT"
}

/**
 * All valid DataBridge type names
 */
export const VALID_TYPES = [
    "STRING",
    "NUMBER",
    "BOOLEAN",
    "DATE",
    "OBJECT",
    "ARRAY",
    "BUFFER",
    "UUID",
    "DECIMAL",
    "ENUM",
    "JSON",
    "TEXT"
] as const;

export type DataType = typeof VALID_TYPES[number];

/**
 * Normalize a type value to a DataBridge type string
 * Handles: String, "string", Types.STRING, "STRING", Types.string
 */
export function normalizeType(type: any): DataType {
    // If it's already a valid DataBridge type string
    if (typeof type === "string") {
        const upper = type.toUpperCase();
        if (VALID_TYPES.includes(upper as any)) {
            return upper as DataType;
        }
        throw new SchemaError(`Invalid type: "${type}"`, "D046");
    }

    // Handle enum values (both uppercase and lowercase keys)
    if (typeof type === "number" && type in Types) {
        return VALID_TYPES[type] as DataType;
    }

    // Handle native constructors
    if (type === String) return "STRING";
    if (type === Number) return "NUMBER";
    if (type === Boolean) return "BOOLEAN";
    if (type === Date) return "DATE";
    if (type === Object) return "OBJECT";
    if (type === Array) return "ARRAY";
    if (type === Buffer) return "BUFFER";

    // If it's already a Types enum value with string values
    if (Object.values(Types).includes(type)) {
        return type as DataType;
    }

    throw new SchemaError(`Invalid type: "${String(type)}"`, "D046");
}