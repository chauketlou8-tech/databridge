import { Document } from "../model";

export interface Model {
    create(data: Record<string, unknown>): Promise<Document>;
    find(where?: Record<string, unknown>): Promise<Document[]>;
    findOne(where?: Record<string, unknown>): Promise<Document | null>;
}