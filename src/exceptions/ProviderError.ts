export default class ProviderError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D001") {
        super(message);
        this.statusCode = statusCode;
        this.name = "ProviderError";
    }

    getStatusCode(): string {
        return this.statusCode;
    }
}