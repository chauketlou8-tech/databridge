import { DataBridge, Schema } from "../../src";

async function main() {
    const db = await DataBridge.connect({
        provider: "postgres",
        url: "postgresql://postgres:TemaSecondary0909%40@localhost:3001/testdb"
    });

    const employeeSchema = new Schema({
        name: String,
        age: Number,
        password: String,
        email: String,
    });

    const model = await db.model("Employees", employeeSchema);

    await model.create({
        name: "John Doe",
        age: 27,
        password: "123",
        email: "john@gmail.com"
    });

    await model.create({
        name: "Eva Marie",
        age: 57,
        password: "123",
        email: "evah@gmail.com"
    });

    const employees = await model.find();

    //console.log("Before delete: ", employees);

    await model.delete({
        age: {
            gt: 20,
            between: [20, 30],
        }
    });

    const employeesAfterFind = await model.find();
    //console.log("After delete: ", employeesAfterFind);

    //await db.close();
}

void main()