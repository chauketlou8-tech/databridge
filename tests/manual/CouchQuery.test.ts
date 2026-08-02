import { DataBridge, Schema } from "../../src";

async function run() {
    console.log("=== Testing CouchDB Query ===\n");

    const db = await DataBridge.connect({
        provider: "couchdb",
        url: "http://localhost:5984",
        database: "testdb"
    });

    console.log("Test 1: Create schema");
    const User = await db.model("users", new Schema({
        name: String,
        email: String,
        age: Number
    }));
    console.log("✅ Schema created");

    console.log("\nTest 2: Insert document");
    await User.create({
        name: "John",
        email: "john@example.com",
        age: 30
    });
    console.log("✅ Document inserted");

    console.log("\nTest 3: Find documents");
    const users = await User.find();
    console.log("✅ Documents found:", users);

    console.log("\nTest 4: Insert another document");
    await User.create({
        name: "Jane",
        email: "jane@example.com",
        age: 25
    });
    console.log("✅ Document inserted");

    console.log("\nTest 5: Find all documents");
    const allUsers = await User.find();
    console.log("✅ All users:", allUsers);

    await db.getDriver().disconnect();
    console.log("\n✅ All tests passed!");
}

run().catch(console.error);