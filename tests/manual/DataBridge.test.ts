import { DataBridge } from "../../src";

async function test() {
    const db = new DataBridge();

    console.log("Test 1: Missing provider");
    // @ts-ignore
    await db.connect({});

    // console.log("\nTest 2: Valid provider");
    //
    // const result = await db.connect({
    //     provider: "postgres",
    //     url: "postgres://localhost:5432/test"
    // });
    //
    // console.log("✓ Connected:", result.constructor.name);
}

test();