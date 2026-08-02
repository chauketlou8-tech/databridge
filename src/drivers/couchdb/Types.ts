/**
 * CouchDB type mappings for DataBridge types
 */
export const TYPE_TO_COUCH: Record<string, string> = {
    "STRING": "string",
    "NUMBER": "number",
    "BOOLEAN": "boolean",
    "DATE": "string",
    "OBJECT": "object",
    "ARRAY": "array",
    "BUFFER": "string",
    "UUID": "string",
    "DECIMAL": "number",
    "TEXT": "string",
    "INT": "number",
    "JSON": "object",
    "ENUM": "string"
};

export function getCouchType(type: string): string {
    const upperType = type.toUpperCase();
    return TYPE_TO_COUCH[upperType] || "string";
}