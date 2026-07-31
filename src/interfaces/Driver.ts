import type { Config } from "../types/config";

export interface Driver {
    connect(config: Config): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string): Promise<any>;
}