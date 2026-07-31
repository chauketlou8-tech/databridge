import type { Model as model } from "../interfaces/Model";
import { Schema } from "../schema"

import Model from "./Model"

export class ModelFactory {
    static createModel(name: string, Schema: Schema, driver: Driver): model {
        return new Model(name, Schema, driver);
    }
}