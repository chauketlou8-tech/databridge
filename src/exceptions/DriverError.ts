export default class DriverError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D025") {
        super(message);
        this.statusCode = statusCode;
        this.name = "DriverError";
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}