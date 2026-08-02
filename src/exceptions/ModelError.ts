export default class ModelError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D056") {
        super(message);
        this.name = "ModelError";
        this.statusCode = statusCode;
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}