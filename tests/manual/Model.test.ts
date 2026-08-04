import { DataBridge, Schema } from "../../src";

async function run() {
    const db = await DataBridge.connect({
        provider: "mariadb",
        host: "localhost",
        user: "root",
        password: "TemaSecondary0909@",
        database: "testdb"
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
    });

    const startUser = await User.find({
        name: {
            startsWith: "J"
        }
    });

    const endUser = await User.find({ name: { endsWith: "n" } });

    const containUser = await User.find({ name: { contains: "oh" } });

    const nthContainUser = await User.find({ name: { nthContain: { second: "o" } } });

    const nthContainPUser = await User.find({ name: { nthContain: { second: ["l", "a"], third: ["o", "a"] } } });

    const regexUser = await User.find({
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