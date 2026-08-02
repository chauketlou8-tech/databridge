import { MariaDriver } from "../src/drivers/mariadb";
import { DriverError, ConnectionError } from "../src/exceptions";

describe("MariaDriver", () => {
    describe("connect", () => {
        it("should throw DriverError when user is missing", async () => {
            const driver = new MariaDriver({
                // @ts-ignore
                provider: "mariadb",
                host: "localhost",
                password: "password",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError when password is missing", async () => {
            const driver = new MariaDriver({
                // @ts-ignore
                provider: "mariadb",
                host: "localhost",
                user: "root",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError when database is missing", async () => {
            const driver = new MariaDriver({
                // @ts-ignore
                provider: "mariadb",
                host: "localhost",
                user: "root",
                password: "password"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should connect with valid config", async () => {
            const driver = new MariaDriver({
                // @ts-ignore
                provider: "mariadb",
                host: "localhost",
                user: "root",
                password: "password",
                database: "testdb"
            });
            await driver.connect();
            expect(driver['connection']).toBeDefined();
        });

        it("should throw ConnectionError when connection fails", async () => {
            const driver = new MariaDriver({
                // @ts-ignore
                provider: "mariadb",
                host: "invalid",
                user: "root",
                password: "password",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(ConnectionError);
        }, 10000);
    });

    describe("disconnect", () => {
        it("should close connection", async () => {
            const driver = new MariaDriver({
                // @ts-ignore
                provider: "mariadb",
                host: "localhost",
                user: "root",
                password: "password",
                database: "testdb"
            });
            await driver.connect();
            const endSpy = jest.spyOn(driver['connection']!, 'end');
            await driver.disconnect();
            expect(endSpy).toHaveBeenCalled();
            expect(driver['connection']).toBeNull();
        });

        it("should not throw when connection is null", async () => {
            // @ts-ignore
            const driver = new MariaDriver({ provider: "mariadb" });
            await expect(driver.disconnect()).resolves.not.toThrow();
        });
    });

    describe("query", () => {
        it("should throw ConnectionError when not connected", async () => {
            // @ts-ignore
            const driver = new MariaDriver({ provider: "mariadb" });
            await expect(driver.query({} as any)).rejects.toThrow(ConnectionError);
        });
    });
});