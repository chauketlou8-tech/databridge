import { DataBridge } from "../src";
import { Schema } from "../src";
import { SchemaError } from "../src/exceptions";

describe("SqliteQuery", () => {
    let db: any;

    beforeAll(async () => {
        // @ts-ignore
        db = await DataBridge.connect({
            provider: "sqlite",
            // @ts-ignore
            filename: ":memory:"
        });
    });

    afterAll(async () => {
        await db.getDriver().disconnect();
    });

    it("should create table from schema", async () => {
        const User = db.model("users", new Schema({
            name: String,
            email: String,
            age: Number
        }));

        await User.create({
            name: "John",
            email: "john@example.com",
            age: 30
        });

        const users = await User.find();
        expect(users).toBeDefined();
        expect(users.length).toBe(1);
    });

    it("should throw error when table already exists", async () => {
        const User = db.model("users", new Schema({
            name: String,
            email: String
        }));

        await expect(User.create({
            name: "Jane",
            email: "jane@example.com"
        })).rejects.toThrow(SchemaError);
    });
});