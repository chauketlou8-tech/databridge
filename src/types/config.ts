export type Config = {
    provider: "postgres" | "mysql" | "mongodb" | "sqlite";
    url?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    options?: Record<any, any>;
}