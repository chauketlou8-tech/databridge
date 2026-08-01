import { Model } from "./Model";
import { Schema } from "../schema";

export interface Database {
    model(name: string, Schema: Schema): Model;
}