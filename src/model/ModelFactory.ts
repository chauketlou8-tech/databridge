import { Schema } from "../schema"

import { Model } from "./Model"
import type { Driver } from "../interfaces/Driver";

export class ModelFactory {
    static createModel(name: string, Schema: Schema, driver: Driver): Model {
        return new Model(name, Schema, driver);
    }
}