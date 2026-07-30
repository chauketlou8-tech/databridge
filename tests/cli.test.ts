function runCli(args: string[]) {
    const originalArgv = process.argv;
    process.argv = ["node", "databridge", ...args];

    jest.resetModules();
    require("../src/cli/cli");

    process.argv = originalArgv;
}

describe("DataBridge CLI", () => {
    it("prints version output", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["version"]);
        expect(spy).toHaveBeenCalledWith("1.0.0.alpha");
        spy.mockRestore();
    });

    it("prints help output", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["help"]);
        expect(spy).toHaveBeenCalledWith(`run databridge <command>

All commands:
    
    update, version, help, init, connect
`);
        spy.mockRestore();
    });

    it("prints unknown command message", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        runCli(["foobar"]);
        expect(spy).toHaveBeenCalledWith(`Unknown command: "foobar"

        To see a list of supported databridge commands, run:
        databridge help`);
        spy.mockRestore();
    });
});
