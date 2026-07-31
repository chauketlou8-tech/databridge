export class MisMatchError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D080") {
        super(message);
        this.name = "MisMatchError";
        this.statusCode = statusCode;
    }
}