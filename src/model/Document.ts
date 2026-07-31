export class Document {
    // expected output: /**
    //  * Document {
    //  *   id: '123e4567-e89b-12d3-a456-426614174000',
    //  *   name: 'John',
    //  *   email: 'john@example.com',
    //  *   age: 30,
    //  *   createdAt: 2026-07-31T00:00:00.000Z,
    //  *   updatedAt: 2026-07-31T00:00:00.000Z
    //  * }
    //  */

    constructor(data: Object) {
        Object.assign(this, data)
    }
}