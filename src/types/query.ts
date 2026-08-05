import { Schema } from "../schema";

export type Query = {
    operation: string;
    type?: string;
    data?: {
        name?: string;
        where?: any;
        data?: Record<string, unknown>;
        Schema?: Schema;
        [key: string]: any;
    };
};