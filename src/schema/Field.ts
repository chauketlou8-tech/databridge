export class Field {
    private field: string;
    private type: unknown;

    constructor(field: string, type: unknown) {
        this.field = field;
        this.type = type;
    }
}