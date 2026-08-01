/**
 * MySQL type mappings for DataBridge types
 */
export const TYPE_TO_MYSQL: Record<string, string> = {
    "STRING": "VARCHAR(255)",
    "NUMBER": "DOUBLE",
    "BOOLEAN": "BOOLEAN",
    "DATE": "DATETIME",
    "OBJECT": "JSON",
    "ARRAY": "JSON",
    "BUFFER": "BLOB",
    "UUID": "VARCHAR(36)",
    "DECIMAL": "DECIMAL(10,2)",
    "TEXT": "TEXT",
    "INT": "INT",
    "JSON": "JSON",
    "ENUM": "VARCHAR(255)"
};

/**
 * Get MySQL type from DataBridge type
 * @param type - DataBridge type name
 * @returns MySQL type string
 */
export function getMysqlType(type: string): string {
    const upperType = type.toUpperCase();
    return TYPE_TO_MYSQL[upperType] || "VARCHAR(255)";
}