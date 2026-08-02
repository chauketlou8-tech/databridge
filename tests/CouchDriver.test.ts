import { CouchDriver } from "../src/drivers/couchdb";
import { DriverError, ConnectionError } from "../src/exceptions";

describe("CouchDriver", () => {
    describe("connect", () => {
        it("should throw DriverError when URL is missing", async () => {
            const driver = new CouchDriver({
                provider: "couchdb",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError when database is missing", async () => {
            const driver = new CouchDriver({
                provider: "couchdb",
                url: "http://localhost:5984"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should connect with valid config", async () => {
            const driver = new CouchDriver({
                provider: "couchdb",
                url: "http://localhost:5984",
                database: "testdb"
            });
            await driver.connect();
            expect(driver['connection']).toBeDefined();
            expect(driver['db']).toBeDefined();
        });

        it("should throw ConnectionError when connection fails", async () => {
            const driver = new CouchDriver({
                provider: "couchdb",
                url: "http://invalid:5984",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(ConnectionError);
        }, 10000);
    });

    describe("disconnect", () => {
        it("should close connection", async () => {
            const driver = new CouchDriver({
                provider: "couchdb",
                url: "http://localhost:5984",
                database: "testdb"
            });
            await driver.connect();
            await driver.disconnect();
            expect(driver['connection']).toBeNull();
            expect(driver['db']).toBeNull();
        });

        it("should not throw when connection is null", async () => {
            const driver = new CouchDriver({ provider: "couchdb" });
            await expect(driver.disconnect()).resolves.not.toThrow();
        });
    });

    describe("query", () => {
        it("should throw ConnectionError when not connected", async () => {
            const driver = new CouchDriver({ provider: "couchdb" });
            await expect(driver.query({} as any)).rejects.toThrow(ConnectionError);
        });
    });
});