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

    console.log("Users created");

    const users = await User.findOne();
    const user = await User.findOne({ name: "John" });
    const UserLess = await User.findOne({
        age: {
            lte: 19
        }
    });

    const userOr = await User.findOne({
        or: [
            { name: "John" },
            { name: "David" }
        ]
    });

    const notUser = await User.findOne({
        not: {
            name: "John"
        }
    });

    const betweenUser = await User.findOne({
        age: {
            between: [20, 30]
        }
    });

    const inUser = await User.findOne({
        name: {
            in: ["David", "Tlou Elvis Chauke"]
        }
    });

    const startUser = await User.findOne({
        name: {
            startsWith: "J"
        }
    });

    const endUser = await User.findOne({ name: { endsWith: "n" } });

    const containUser = await User.findOne({ name: { contains: "oh" } });

    const nthContainUser = await User.findOne({ name: { nthContain: { second: "o" } } });

    const nthContainPUser = await User.findOne({ name: { nthContain: { second: ["l", "a"], third: ["o", "a"] } } });

    const regexUser = await User.findOne({
        email: ".*@gmail.com"
    })

    console.log("Users:", users);
    console.log("User name John:", user);
    console.log("User less equal to 19:", UserLess);
    console.log("Or query users:", userOr);
    console.log("Not users:", notUser);
    console.log("Between users:", betweenUser);
    console.log("InUser:", inUser);
    console.log("Starting User:", startUser);
    console.log("Ending User:", endUser);
    console.log("ContainUser:", containUser);
    console.log("nthContainUser:", nthContainUser);
    console.log("nthContainPUser:", nthContainPUser);
    console.log("RegexUser:", regexUser);
}

void run();