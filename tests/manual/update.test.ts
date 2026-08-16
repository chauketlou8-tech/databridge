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

    const employees = await db.model("Employees", employeeSchema);

    await employees.create({
        name: "John Doe",
        age: 27,
        password: "123",
        email: "john@gmail.com"
    });

    await employees.create({
        name: "Eva Marie",
        age: 57,
        password: "123",
        email: "evah@gmail.com"
    });

    console.log();

    await employees.update({
        name: {
            nin: ["John Doe", "Eva Marie"],
            nthContain: {
                second: ["a", "e"],
                third: ["r", "n"]
            }
        },
        set: {
            age: 28,
            email: "john2@gmail.com"
        }
    })

    //await db.close();
}

void main()