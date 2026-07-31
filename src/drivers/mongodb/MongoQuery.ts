import type { Query } from "../../types/query";
import {NullError, QueryError} from "../../exceptions";

export default class MongoQuery {
    constructor(query: Query) {
        this.query = query;
        this.run();
    }

    /*
    *        const query: Query = {
            operation: "create model",
            data: {
                model: name,
                Schema
            }
        }
    */

    private read(): string[] {
        this.operations = this.query.operation.split(" ");
        this.data = this.query.data;

        if (!this.query.operation) {
            throw new QueryError("Operation note Specified", "D035")
        }

        switch (this.operation[0].toLowerCase()) {
            case "create":
                if (this.operations.length === 1) {
                    throw new NullError("Error occurred");
                }
                break;
        }
    }

    public run(): void {

    }
}