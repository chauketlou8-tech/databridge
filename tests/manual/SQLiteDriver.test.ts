// import { SQLiteDriver } from "../../src/drivers/sqlite";
//
// async function run() {
//     console.log("=== Testing SQLite Driver ===\n");
//
//     console.log("Test 1: File-based connection");
//     const driver = new SQLiteDriver({
//         provider: "sqlite",
//         database: "test.db"  // This will create a file
//     });
//     await driver.connect();
//     console.log("✅ Connected - test.db file created");
//
//     console.log("\nTest 2: Execute query");
//     const result = await driver.query("SELECT 1");
//     console.log("✅ Query result:", result);
//
//     console.log("\nTest 3: Create table and insert data");
//     await driver.query("CREATE TABLE test (name TEXT)");
//     await driver.query("INSERT INTO test (name) VALUES ('test')");
//     const rows = await driver.query("SELECT * FROM test");
//     console.log("✅ Data:", rows);
//
//     console.log("\nTest 4: Disconnect");
//     await driver.disconnect();
//     console.log("✅ Disconnected - test.db file remains");
//
//     console.log("\nCheck your project directory for test.db");
// }
//
// void run();