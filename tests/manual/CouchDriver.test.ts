import { DataBridge, Schema } from "../../src";

async function run() {
    console.log("=== Testing CouchDB Driver ===\n");

    const db = await DataBridge.connect({
        provider: "couchdb",
        url: "http://localhost:5984",
        database: "testdb"
    });

    console.log("Test 1: Create model");
    const User = await db.model("users", new Schema({
        name: String,
        email: String,
        age: Number
    }));
    console.log("✅ Model created");

    console.log("\nTest 2: Create document");
    await User.create({
        name: "John",
        email: "john@example.com",
        age: 30
    });
    console.log("✅ Document created");

    console.log("\nTest 3: Find documents");
    const users = await User.find();
    console.log("✅ Documents found:", users);

    await db.getDriver().disconnect();
    console.log("\n✅ All tests passed!");
}

run().catch(console.error);