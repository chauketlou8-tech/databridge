import { DataBridge } from "../src";
import { Schema } from "../src";

describe("CouchQuery", () => {
    let db: any;

    beforeAll(async () => {
        db = await DataBridge.connect({
            provider: "couchdb",
            url: "http://localhost:5984",
            database: "testdb"
        });
    });

    afterAll(async () => {
        await db.getDriver().disconnect();
    });

    it("should create document from schema", async () => {
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
        expect(users[0].name).toBe("John");
        expect(users[0].email).toBe("john@example.com");
        expect(users[0].age).toBe(30);
    });

    it("should insert data into database", async () => {
        const User = db.model("users_insert", new Schema({
            name: String,
            email: String,
            age: Number
        }));

        await User.create({
            name: "Jane",
            email: "jane@example.com",
            age: 25
        });

        const users = await User.find();
        expect(users).toBeDefined();
        expect(users.length).toBe(1);
        expect(users[0].name).toBe("Jane");
        expect(users[0].email).toBe("jane@example.com");
        expect(users[0].age).toBe(25);
    });

    it("should map DataBridge types to CouchDB types correctly", async () => {
        const Product = db.model("products", new Schema({
            name: String,
            price: Number,
            inStock: Boolean,
            createdAt: Date,
            metadata: Object,
            tags: Array,
            uuid: "UUID",
            decimal: "DECIMAL",
            text: "TEXT",
            int: "INT",
            json: "JSON",
            enum: "ENUM"
        }));

        await Product.create({
            name: "Laptop",
            price: 1200.50,
            inStock: true,
            createdAt: new Date().toISOString(),
            metadata: { brand: "Dell" },
            tags: ["electronics", "computers"],
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            decimal: 99.99,
            text: "Long description here",
            int: 10,
            json: { key: "value" },
            enum: "RED"
        });

        const products = await Product.find();
        expect(products).toBeDefined();
        expect(products.length).toBe(1);
    });

    it("should throw error when creating document with missing fields", async () => {
        const User = db.model("users_missing", new Schema({
            name: String,
            email: String,
            age: Number
        }));

        await expect(User.create({
            name: "John"
        })).rejects.toThrow();
    });
});