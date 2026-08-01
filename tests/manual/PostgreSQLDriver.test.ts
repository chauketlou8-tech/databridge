import { DataBridge } from "../../src";

async function run() {
    console.log("=== Testing PostgreSQL Driver ===\n");

    console.log("Test 1: Valid connection");
    const db = await DataBridge.connect({
        provider: "postgres",
        url: "postgres://localhost:5432/testdb"
    });
    console.log("✅ Connected:", db);

    // console.log("\nTest 2: Empty URL");
    // await DataBridge.connect({
    //     provider: "postgres",
    //     url: ""
    // });
}

void run();