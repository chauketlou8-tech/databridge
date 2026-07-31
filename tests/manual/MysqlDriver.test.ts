import { MysqlDriver } from "../../src/drivers/mysql";

async function run() {
    console.log("=== Testing MySQL Driver ===\n");

    console.log("Test 1: Valid connection");
    const driver = new MysqlDriver({
        provider: "mysql",
        host: "localhost",
        user: "root",
        password: "TemaSecondary0909@",
        database: "testdb"
    });
    await driver.connect();
    console.log("✅ Connected");

    console.log("\nTest 2: Execute query");
    const result = await driver.query("select 1");
    console.log("✅ Query result:", result);

    console.log("\nTest 3: Disconnect");
    await driver.disconnect();
    console.log("✅ Disconnected");

    console.log("\nTest 4: Missing user");
    const invalidDriver = new MysqlDriver({
        provider: "mysql",
        host: "localhost",
        password: "password",
        database: "testdb"
    });
    await invalidDriver.connect();
}

void run()