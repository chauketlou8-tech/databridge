import { DataBridge, Schema } from "../../src";

async function run() {
    const db = await DataBridge.connect({
        provider: "sqlite",
        filename: "testQ.db"
    });

    const User = await db.model(
        "users",
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

    await User.create({
        name: "John",
        email: "john2@example.com",
        age: 40
    });

    await User.create({
        name: "Tlou Elvis Chauke",
        email: "chauketlou8@gmail.com",
        age: 19
    });

    console.log("User created");

    const users = await User.find();
    const user = await User.find({ name: "John" });
    console.log("Users:", users);
    console.log("User name John:", user);
}

void run();