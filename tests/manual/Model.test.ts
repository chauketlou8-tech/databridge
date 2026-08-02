import { DataBridge, Schema } from "../../src";

async function run() {
    const db = await DataBridge.connect({
        provider: "postgres",
        url: "postgresql://postgres:password@localhost:port/DBName"
    });
    const User = await db.model(
        "User",
        new Schema({
            name: String,
            email: String,
            age: Number
        }));

    console.log("Model created");

    await User.create({
        name: "John",
        email: "john@example.com",
        age: 21
    });

    console.log("User created");

    const users = await User.find();
    console.log("Users:", users);
}

void run();