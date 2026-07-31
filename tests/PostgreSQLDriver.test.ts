import { DataBridge } from "../src";
import { DriverError } from "../src/exceptions";

describe("PostgreSQL Driver", () => {
    it("should connect with valid URL", async () => {
        const db = await DataBridge.connect({
            provider: "postgres",
            url: "postgres://localhost:5432/testdb"
        });
        expect(db).toBeDefined();
    });

    it("should throw DriverError when URL is empty", async () => {
        await expect(DataBridge.connect({
            provider: "postgres",
            url: ""
        })).rejects.toThrow(DriverError);
    });
});