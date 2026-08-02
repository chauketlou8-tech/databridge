import { Document } from "../model";

export interface Model {
    create(data: Record<string, unknown>): Document;
    find(where?: Record<string, unknown>): Promise<Document[]>;
}