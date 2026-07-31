import { Document } from "../model";

export interface Model {
    create({ data: unknown }): Document;
}