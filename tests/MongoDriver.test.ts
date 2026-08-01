import { MongoDriver } from "../src/drivers/mongodb";
import { DriverError, ConnectionError } from "../src/exceptions";

describe("MongoDriver", () => {
    describe("connect", () => {
        it("should throw DriverError when URL is empty", async () => {
            const driver = new MongoDriver({ provider: "mongodb", url: "" });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError with D024 code when URL is empty", async () => {
            const driver = new MongoDriver({ provider: "mongodb", url: "" });
            try {
                await driver.connect();
            } catch (error: any) {
                expect(error.statusCode).toBe("D024");
                expect(error.message).toBe("The connection URL is missing or empty");
            }
        });

        it("should connect with valid URL", async () => {
            const driver = new MongoDriver({
                provider: "mongodb",
                url: "mongodb://localhost:27017/testdb"
            });
            await driver.connect();
            expect(driver['client']).toBeDefined();
            expect(driver['db']).toBeDefined();
        });

        it("should throw ConnectionError when connection fails", async () => {
            const driver = new MongoDriver({
                provider: "mongodb",
                url: "mongodb://invalid:27017/testdb"
            });
            await expect(driver.connect()).rejects.toThrow(ConnectionError);
        }, 10000); // Increase timeout to 10 seconds
    });

    describe("disconnect", () => {
        it("should close connection", async () => {
            const driver = new MongoDriver({
                provider: "mongodb",
                url: "mongodb://localhost:27017/testdb"
            });
            await driver.connect();
            const closeSpy = jest.spyOn(driver['client']!, 'close');
            await driver.disconnect();
            expect(closeSpy).toHaveBeenCalled();
        });

        it("should not throw when client is null", async () => {
            const driver = new MongoDriver({ provider: "mongodb", url: "" });
            await expect(driver.disconnect()).resolves.not.toThrow();
        });
    });

    describe("query", () => {
        it("should throw ConnectionError when not connected", async () => {
            const driver = new MongoDriver({ provider: "mongodb", url: "" });
            // @ts-ignore
            await expect(driver.query("test")).rejects.toThrow(ConnectionError);
        });
    });
});