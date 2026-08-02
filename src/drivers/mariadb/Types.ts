/**
 * MariaDB type mappings for DataBridge types
 */
export const TYPE_TO_MARIA: Record<string, string> = {
    "STRING": "varchar(255)",
    "NUMBER": "double",
    "BOOLEAN": "boolean",
    "DATE": "datetime",
    "OBJECT": "json",
    "ARRAY": "json",
    "BUFFER": "blob",
    "UUID": "varchar(36)",
    "DECIMAL": "decimal(10,2)",
    "TEXT": "text",
    "INT": "int",
    "JSON": "json",
    "ENUM": "varchar(255)"
};

/**
 * Get MariaDB type from DataBridge type
 * @param type - DataBridge type name
 * @returns MariaDB type string
 */
export function getMariaType(type: string): string {
    const upperType = type.toUpperCase();
    return TYPE_TO_MARIA[upperType] || "varchar(255)";
}