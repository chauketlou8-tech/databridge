export default class QueryError extends Error {
    private readonly statusCode: string;

    constructor(message: string, statusCode: string = "D036") {
        super(message);
        this.name = "QueryError";
        this.statusCode = statusCode;
    }
}