export class SchemaError extends Error {
    private statusCode: string;

    constructor(message: string, statusCode: string = "D045") {
        super(message);
        this.name = "SchemaError";
        this.statusCode = statusCode;
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}