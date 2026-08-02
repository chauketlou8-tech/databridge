import { DataBridge } from "../src";
import { Schema } from "../src";
import { SchemaError } from "../src/exceptions";

describe("MariaQuery", () => {
    let db: any;

    beforeAll(async () => {
        db = await DataBridge.connect({
            // @ts-ignore
            provider: "mariadb",
            host: "localhost",
            user: "root",
            password: "password",
            database: "testdb"
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

    it("should map DataBridge types to MariaDB types correctly", async () => {
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
            createdAt: new Date(),
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

    it("should insert data into table", async () => {
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
});