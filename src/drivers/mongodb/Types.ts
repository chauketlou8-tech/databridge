/**
 * MongoDB BSON Type mappings for DataBridge types
 */
export const TYPE_TO_BSON: Record<string, string> = {
    "STRING": "string",
    "NUMBER": "double",
    "BOOLEAN": "bool",
    "DATE": "date",
    "OBJECT": "object",
    "ARRAY": "array",
    "BUFFER": "binData",
    "UUID": "string",
    "DECIMAL": "decimal",
    "TEXT": "string",
    "INT": "int",
    "JSON": "object",
    "ENUM": "string"
};

export function getBsonType(type: string): string {
    const upperType = type.toUpperCase();
    return TYPE_TO_BSON[upperType] || "string";
}