/**
 * Represents a document/record returned from the database
 *
 * @example
 * const user = await User.create({ name: "John", email: "john@example.com" });
 * console.log(user.name); // "John"
 * console.log(user.email); // "john@example.com"
 *
 * // Documents can be used like plain objects
 * const { name, email } = user;
 */
export class Document {
    constructor(data: Object) {
        Object.assign(this, data);
    }
}