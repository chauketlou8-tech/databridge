import { DataBridge, Schema } from "../../src";

async function run() {
    console.log("=== Testing MariaDB Driver ===\n");

    const db = await DataBridge.connect({
        // @ts-ignore
        provider: "mariadb",
        host: "localhost",
        user: "root",
        password: "password",
        database: "testdb"
    });

    console.log("Test 1: Create model");
    const User = await db.model("users", new Schema({
        name: String,
        email: String,
        age: Number
    }));
    console.log("✅ Model created");

    console.log("\nTest 2: Create record");
    await User.create({
        name: "John",
        email: "john@example.com",
        age: 30
    });
    console.log("✅ Record created");

    /*
    console.log("\nTest 3: Find records");
    const users = await User.find();
    console.log("✅ Users found:", users);*/

    await db.getDriver().disconnect();
    console.log("\n✅ All tests passed!");
}

run().catch(console.error);