import { Schema } from "../schema";

export class Model {
    private name: string;
    private Schema: Schema

    constructor(name: string, Schema: Schema) {
        this.name = name;
        this.Schema = Schema;
    }

    // model logic
}