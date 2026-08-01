/**
 * SQLite type mappings for DataBridge types
 */
export const TYPE_TO_SQLITE: Record<string, string> = {
    "STRING": "text",
    "NUMBER": "real",
    "BOOLEAN": "integer",
    "DATE": "text",
    "OBJECT": "text",
    "ARRAY": "text",
    "BUFFER": "blob",
    "UUID": "text",
    "DECIMAL": "text",
    "TEXT": "text",
    "INT": "integer",
    "JSON": "text",
    "ENUM": "text"
};

/**
 * Get SQLite type from DataBridge type
 * @param type - DataBridge type name
 * @returns SQLite type string
 */
export function getSqliteType(type: string): string {
    const upperType = type.toUpperCase();
    return TYPE_TO_SQLITE[upperType] || "text";
}