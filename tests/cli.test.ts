import { runCli } from "./helpers/cli-runner";

describe("DataBridge CLI", () => {
    it("prints version output", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["version"]);
        expect(spy).toHaveBeenCalledWith("1.0.0-alpha");
        spy.mockRestore();
    });

    it("prints help output", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["help"]);
        expect(spy).toHaveBeenCalledWith(`
Usage: databridge <command>

Commands:
  version    Display the current version
  help       Show this help message

Examples:
  databridge version
  databridge help

For more information, visit:
  https://databridge-documentation.vercel.app
`);
        spy.mockRestore();
    });

    it("prints unknown command message", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        runCli(["foobar"]);

        expect(spy).toHaveBeenCalledWith(`Unknown command: "foobar"`);
        expect(logSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith("To see a list of supported commands, run:");
        expect(logSpy).toHaveBeenCalledWith("  databridge help");

        spy.mockRestore();
        logSpy.mockRestore();
    });

    it("prints unknown command message when no command entered", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        runCli([]);

        expect(spy).toHaveBeenCalledWith(`Unknown command: "No command entered"`);
        expect(logSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith("To see a list of supported commands, run:");
        expect(logSpy).toHaveBeenCalledWith("  databridge help");

        spy.mockRestore();
        logSpy.mockRestore();
    });
});