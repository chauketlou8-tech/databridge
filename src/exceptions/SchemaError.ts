export default class SchemaError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D047") {
        super(message);
        this.name = "SchemaError";
        this.statusCode = statusCode;
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}