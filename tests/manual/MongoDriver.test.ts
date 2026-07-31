import { MongoDriver } from "../../src/drivers/mongodb";

async function run() {
    console.log("=== Testing MongoDB Driver ===\n");

    console.log("Test 1: Valid connection");
    const driver = new MongoDriver({
        provider: "mongodb",
        url: "mongodb://localhost:27017/testdb"
    });
    await driver.connect();
    console.log("✅ Connected");

    console.log("\nTest 2: Disconnect");
    await driver.disconnect();
    console.log("✅ Disconnected");

    console.log("\nTest 3: Empty URL");
    const invalidDriver = new MongoDriver({
        provider: "mongodb",
        url: ""
    });
    await invalidDriver.connect();
}

void run();