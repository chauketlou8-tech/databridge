import { DataBridge, Schema } from "../src";

describe("Model", () => {
    let db: any;

    beforeAll(async () => {
        db = await DataBridge.connect({
            provider: "postgres",
            url: "postgresql://postgres:password@localhost:5432/testdb"
        });
    });

    afterAll(async () => {
        await db.getDriver().disconnect();
    });

    it("should create a model", async () => {
        const User = await db.model("User", new Schema({
            name: String,
            email: String,
            age: Number
        }));

        expect(User).toBeDefined();
        expect(User.name).toBe("User");
    });

    it("should create a record", async () => {
        const User = await db.model("User", new Schema({
            name: String,
            email: String,
            age: Number
        }));

        const user = await User.create({
            name: "John",
            email: "john@example.com",
            age: 21
        });

        expect(user).toBeDefined();
        expect(user.name).toBe("John");
        expect(user.email).toBe("john@example.com");
        expect(user.age).toBe(21);
    });

    it("should throw error when creating model without schema", async () => {
        await expect(db.model("User", null as any)).rejects.toThrow();
    });

    it("should throw error when creating model without name", async () => {
        await expect(db.model("", new Schema({
            name: String
        }))).rejects.toThrow();
    });

    it("should throw error when creating record with missing fields", async () => {
        const User = await db.model("User", new Schema({
            name: String,
            email: String,
            age: Number
        }));

        await expect(User.create({
            name: "John"
        })).rejects.toThrow();
    });

    it("should throw error when creating record with extra fields", async () => {
        const User = await db.model("User", new Schema({
            name: String,
            email: String
        }));

        await expect(User.create({
            name: "John",
            email: "john@example.com",
            age: 21
        })).rejects.toThrow();
    });

    it("should throw error when field type mismatch", async () => {
        const User = await db.model("User", new Schema({
            name: String,
            age: Number
        }));

        await expect(User.create({
            name: "John",
            age: "twenty one"
        })).rejects.toThrow();
    });
});