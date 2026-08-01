/**
 * PostgreSQL type mappings for DataBridge types
 */
export const TYPE_TO_POSTGRES: Record<string, string> = {
    "STRING": "varchar(255)",
    "NUMBER": "double precision",
    "BOOLEAN": "boolean",
    "DATE": "timestamp",
    "OBJECT": "jsonb",
    "ARRAY": "jsonb",
    "BUFFER": "bytea",
    "UUID": "uuid",
    "DECIMAL": "decimal(10,2)",
    "TEXT": "text",
    "INT": "integer",
    "JSON": "jsonb",
    "ENUM": "varchar(255)"
};

/**
 * Get PostgreSQL type from DataBridge type
 * @param type - DataBridge type name
 * @returns PostgreSQL type string
 */
export function getPostgresType(type: string): string {
    const upperType = type.toUpperCase();
    return TYPE_TO_POSTGRES[upperType] || "varchar(255)";
}