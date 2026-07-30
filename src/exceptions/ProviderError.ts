export class ProviderError extends Error {
    constructor(message: string) {
        super();
        this.message = "No database provider was specified."
    }
}