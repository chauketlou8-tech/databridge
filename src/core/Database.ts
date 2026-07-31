import type { Database as DB } from "../interfaces/Database";
import { Driver } from "../interfaces/Driver";
import { ModelFactory } from "../model/ModelFactory";

export default class Database implements DB {
    private readonly driver: Driver;

    constructor(driver: Driver) {
        this.driver = driver;
    }

    public model(name: string, Schema: Schema): Model {
        return ModelFactory.createModel(name, Schema);
    }

    getDriver(): Driver {
        return this.driver;
    }
}