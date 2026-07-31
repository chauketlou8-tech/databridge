import { MysqlDriver } from "../src/drivers/mysql";
import { DriverError, ConnectionError } from "../src/exceptions";

describe("MysqlDriver", () => {
    describe("connect", () => {
        it("should throw DriverError when user is missing", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                password: "password",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError with D024 code when user is missing", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                password: "password",
                database: "testdb"
            });
            try {
                await driver.connect();
            } catch (error: any) {
                expect(error.statusCode).toBe("D024");
                expect(error.message).toBe("Database user is missing or empty");
            }
        });

        it("should throw DriverError when password is missing", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                user: "root",
                database: "testdb"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should throw DriverError when database is missing", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                user: "root",
                password: "password"
            });
            await expect(driver.connect()).rejects.toThrow(DriverError);
        });

        it("should connect with valid config", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                user: "root",
                password: "TemaSecondary0909@",
                database: "testdb"
            });
            await driver.connect();
            expect(driver['connection']).toBeDefined();
        });

        it("should throw ConnectionError when connection fails", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
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
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                user: "root",
                password: "TemaSecondary0909@",
                database: "testdb"
            });
            await driver.connect();
            const endSpy = jest.spyOn(driver['connection']!, 'end');
            await driver.disconnect();
            expect(endSpy).toHaveBeenCalled();
            expect(driver['connection']).toBeNull();
        });

        it("should not throw when connection is null", async () => {
            const driver = new MysqlDriver({ provider: "mysql" });
            await expect(driver.disconnect()).resolves.not.toThrow();
        });
    });

    describe("query", () => {
        it("should throw ConnectionError when not connected", async () => {
            const driver = new MysqlDriver({ provider: "mysql" });
            await expect(driver.query("SELECT * FROM users")).rejects.toThrow(ConnectionError);
        });

        it("should execute query when connected", async () => {
            const driver = new MysqlDriver({
                provider: "mysql",
                host: "localhost",
                user: "root",
                password: "TemaSecondary0909@",
                database: "testdb"
            });
            await driver.connect();
            const result = await driver.query("SELECT 1");
            expect(result).toBeDefined();
        });
    });
});