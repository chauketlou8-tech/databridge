export default class NullError extends Error {
    constructor(public message: string, private statusCode: string = "D081") {
        super(message);
        this.statusCode = statusCode;
        this.name = "NullError";
    }
}