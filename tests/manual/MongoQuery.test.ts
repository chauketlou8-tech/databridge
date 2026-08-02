import { DataBridge } from "../../src";
import { Schema } from "../../src";

async function run() {
    console.log("=== Testing MongoQuery ===\n");

    const db = await DataBridge.connect({
        provider: "mongodb",
        url: "mongodb+srv://username:password@cluster.h6kymkq.mongodb.net/dbName?retryWrites=true&w=majority"
    });

    console.log("Test 1: Create collection from schema");
    const User = await db.model("users", new Schema({
        name: String,
        email: String,
        age: Number
    }));


    await User.create({
        name: "John",
        email: "john@example.com",
        age: 30
    });
    console.log("✅ User created");

    const users = await User.find();
    console.log("✅ Users found:", users);

    await db.getDriver().disconnect();
    console.log("\n✅ All tests passed!");
}

void run();