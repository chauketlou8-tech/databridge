import type { Config } from "../types/config";
import { Query } from "../types/query";

export interface Driver {
    connect(config: Config): Promise<void>;
    disconnect(): Promise<void>;
    query(query: Query): Promise<any>;
}