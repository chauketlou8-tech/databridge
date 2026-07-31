export default class ConnectionError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D015") {
        super(message);
        this.statusCode = statusCode;
        this.name = "ConnectionError";
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}