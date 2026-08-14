import { Document } from "../model";

export interface Model {
    create(data: Record<string, unknown>): Promise<Document>;
    find(where?: Record<string, unknown>): Promise<Document[]>;
    findOne(where?: Record<string, unknown>): Promise<Document | null>;
    update(where: Record<string, unknown>, options: unknown): Promise<Document[] | null>;
}