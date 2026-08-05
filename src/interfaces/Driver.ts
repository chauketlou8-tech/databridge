import type { Config } from "../types/config";
import type { Query } from "../types/query";
import type { Model } from "../model";

export interface Driver {
    connect(config: Config): Promise<void>;
    disconnect(): Promise<void>;
    query(model: Model | null, query: Query): Promise<any>;
}