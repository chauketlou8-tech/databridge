export function runCli(args: string[]) {
    const originalArgv = process.argv;

    const exitMock = jest.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
    });

    process.argv = ["node", "databridge", ...args];

    jest.resetModules();

    try {
        require("../../src/cli/cli");
    } catch (error) {
        if (error instanceof Error && error.message === "process.exit called") {
        } else {
            throw error;
        }
    }

    process.argv = originalArgv;
    exitMock.mockRestore();
}