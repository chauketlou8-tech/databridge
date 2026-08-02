export type Config = {
    provider: "postgres" | "mysql" | "mongodb" | "sqlite" | "mariadb" | "couchdb";
    url?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    filename?: string;
    options?: Record<any, any>;
}