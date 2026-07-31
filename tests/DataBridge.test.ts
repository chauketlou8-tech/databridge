import { DataBridge } from "../src";
import { ProviderError } from "../src/exceptions";
import Database from "../src/core/Database";

describe("DataBridge", () => {
    let databridge: DataBridge;

    beforeEach(() => {
        databridge = new DataBridge();
    });

    describe("connect", () => {
        it("should throw ProviderError when provider is missing", async () => {
            // @ts-expect-error - Testing invalid config
            await expect(databridge.connect({})).rejects.toThrow(ProviderError);
        });

        it("should throw ProviderError with message when provider is missing", async () => {
            // @ts-expect-error - Testing invalid config
            await expect(databridge.connect({})).rejects.toThrow(
                "No database provider was specified."
            );
        });

        it("should return Database instance when provider is valid", async () => {
            const config = {
                provider: "postgres",
                url: "postgres://localhost:5432/test"
            };

            const db = await databridge.connect(config);
            expect(db).toBeInstanceOf(Database);
        });

        // TODO: Uncomment when provider validation is implemented
        // it("should throw ProviderError when provider is unsupported", async () => {
        //     const config = {
        //         provider: "mongodb",
        //         url: "mongodb://localhost:27017/test"
        //     };
        //
        //     // Wait for validation to be implemented
        //     await expect(databridge.connect(config)).rejects.toThrow(ProviderError);
        // });
    });
});