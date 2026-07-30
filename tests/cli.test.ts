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
  init       Initialize a new DataBridge project
  connect    Connect to a database

Examples:
  databridge version
  databridge help
  databridge init my-project
  databridge connect --provider postgres

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

    it("handles init command with project name", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["init", "my-project"]);
        expect(spy).toHaveBeenCalledWith("Initializing DataBridge project: my-project");
        spy.mockRestore();
    });

    it("handles init command without project name", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        runCli(["init"]);
        expect(spy).toHaveBeenCalledWith("Error: Project name is required");
        spy.mockRestore();
    });

    it("handles connect command with provider and url", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["connect", "--provider=postgres", "--url=postgres://localhost:5432/db"]);
        expect(spy).toHaveBeenCalledWith("Connecting to postgres...");
        spy.mockRestore();
    });

    it("handles connect command without provider", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        runCli(["connect"]);
        expect(spy).toHaveBeenCalledWith("Error: Provider is required");
        spy.mockRestore();
    });
});