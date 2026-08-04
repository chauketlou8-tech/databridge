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
        name: "David",
        email: "david@example.com",
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
    const UserLess = await User.find({
        age: {
            lte: 19
        }
    });

    const userOr = await User.find({
        or: [
            { name: "John" },
            { name: "David" }
        ]
    });

    const notUser = await User.find({
        not: {
            name: "John"
        }
    });

    const betweenUser = await User.find({
        age: {
            between: [20, 30]
        }
    });

    const inUser = await User.find({
        name: {
            in: ["David", "Tlou Elvis Chauke"]
        }
    })

    console.log("Users:", users);
    console.log("User name John:", user);
    console.log("User less equal to 19:", UserLess);
    console.log("Or query users:", userOr);
    console.log("Not users:", notUser);
    console.log("Between users:", betweenUser);
    console.log("InUser:", inUser);
}

void run();