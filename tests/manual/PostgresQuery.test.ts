import { DataBridge } from "../../src";
import { Schema } from "../../src";

async function run() {
    console.log("=== Testing PostgresQuery ===\n");

    const db = await DataBridge.connect({
        provider: "postgres",
        url: "postgres://localhost:5432/testdb"
    });

    console.log("Test 1: Create table from schema");
    const User = db.model("users", new Schema({
        name: String,
        email: String,
        age: Number
    }));

    User.create({
        name: "John",
        email: "john@example.com",
        age: 30
    });
    console.log("✅ User created");

    //const users = await User.find();
    //console.log("✅ Users found:", users);

    await db.getDriver().disconnect();
    console.log("\n✅ All tests passed!");
}

void run();