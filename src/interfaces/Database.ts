import { Model } from "./Model";

export interface Database {
    model(name: string, Schema: Schema): Model;
}