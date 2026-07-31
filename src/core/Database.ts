import { Database as DB } from "../interfaces/Database";
import { Driver } from "../interfaces/Driver";

export default class Database implements DB {
    private readonly driver: Driver;

    constructor(driver: Driver) {
        this.driver = driver;
    }

    getDriver(): Driver {
        return this.driver;
    }
}