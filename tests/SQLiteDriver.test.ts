import { SQLiteDriver } from "../src/drivers/sqlite";
import { DriverError, ConnectionError } from "../src/exceptions";
import fs from "fs";

describe("SQLiteDriver", () => {
    const testDbPath = ":memory:";

    describe("connect", () => {
        it("should throw DriverError when database is missing", async () => {
            const driver = new SQLiteDriver({ provider: "sqlite" });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError with D024 code when database is missing", async () => {
            const driver = new SQLiteDriver({ provider: "sqlite" });
            try {
                await driver.connect();
            } catch (error: any) {
                expect(error.statusCode).toBe("D024");
                expect(error.message).toBe("SQLite database file is missing or empty");
            }
        });

        it("should connect with in-memory database", async () => {
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: ":memory:"
            });
            await driver.connect();
            expect(driver['db']).toBeDefined();
        });

        it("should create and connect to file database", async () => {
            const dbPath = "test.db";
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: dbPath
            });
            await driver.connect();
            expect(driver['db']).toBeDefined();
            expect(fs.existsSync(dbPath)).toBe(true);

            await driver.disconnect();
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
            }
        });

        it("should throw ConnectionError when connection fails", async () => {
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: "/invalid/path/test.db"
            });
            await expect(driver.connect()).rejects.toThrow(ConnectionError);
        });
    });

    describe("disconnect", () => {
        it("should close connection", async () => {
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: ":memory:"
            });
            await driver.connect();
            const closeSpy = jest.spyOn(driver['db']!, 'close');
            await driver.disconnect();
            expect(closeSpy).toHaveBeenCalled();
            expect(driver['db']).toBeNull();
        });

        it("should not throw when db is null", async () => {
            const driver = new SQLiteDriver({ provider: "sqlite" });
            await expect(driver.disconnect()).resolves.not.toThrow();
        });
    });

    describe("query", () => {
        it("should throw ConnectionError when not connected", async () => {
            const driver = new SQLiteDriver({ provider: "sqlite" });
            await expect(driver.query("SELECT 1")).rejects.toThrow(ConnectionError);
        });

        it("should execute query when connected", async () => {
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: ":memory:"
            });
            await driver.connect();
            const result = await driver.query("SELECT 1");
            expect(result).toBeDefined();
        });

        it("should create table and query data", async () => {
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: ":memory:"
            });
            await driver.connect();

            await driver.query("CREATE TABLE test (name TEXT)");
            await driver.query("INSERT INTO test (name) VALUES ('test')");
            const result = await driver.query("SELECT * FROM test");

            expect(result).toEqual([{ name: "test" }]);
        });

        it("should throw ConnectionError on failed query", async () => {
            const driver = new SQLiteDriver({
                provider: "sqlite",
                database: ":memory:"
            });
            await driver.connect();
            await expect(driver.query("INVALID SQL")).rejects.toThrow(ConnectionError);
        });
    });
});