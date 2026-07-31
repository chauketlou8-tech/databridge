export default class ConnectionError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D016") {
        super(message);
        this.statusCode = statusCode;
        this.name = "ConnectionError";
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}