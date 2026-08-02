import { DataBridge, Schema } from "../../src";

async function run() {
    console.log("=== Testing MariaDB Query ===\n");

    const db = await DataBridge.connect({
        provider: "mariadb",
        host: "localhost",
        user: "root",
        password: "password",
        database: "testdb"
    });

    console.log("Test 1: Create table from schema");
    const User = await db.model("users", new Schema({
        name: String,
        email: String,
        age: Number
    }));
    console.log("✅ Table created");

    console.log("\nTest 2: Insert record");
    await User.create({
        name: "John",
        email: "john@example.com",
        age: 30
    });
    console.log("✅ Record inserted");

    /*
    console.log("\nTest 3: Find records");
    const users = await User.find();
    console.log("✅ Records found:", users);*/

    console.log("\nTest 4: Insert another record");
    await User.create({
        name: "Jane",
        email: "jane@example.com",
        age: 25
    });
    console.log("✅ Record inserted");

    /*
    console.log("\nTest 5: Find all records");
    const allUsers = await User.find();
    console.log("✅ All users:", allUsers);*/

    await db.getDriver().disconnect();
    console.log("\n✅ All tests passed!");
}

run().catch(console.error);