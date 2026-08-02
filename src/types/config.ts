export type Config = {
    provider: "postgres" | "mysql" | "mongodb" | "sqlite" | "mariadb";
    url?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    options?: Record<any, any>;
}