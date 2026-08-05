import { DataBridge, Schema, Types } from "../../src";
import * as fs from "fs";
import * as path from "path";

async function run() {
    const db = await DataBridge.connect({
        provider: "mariadb",
        host: "localhost",
        user: "root",
        password: "TemaSecondary0909@",
        database: "testdb"
    });

    // ==================== MODELS WITH ALL TYPE VARIATIONS ====================

    const User = await db.model(
        "users",
        new Schema({
            name: Types.STRING,
            email: Types.string,
            age: Types.NUMBER,
            score: Types.number,
            salary: Types.DECIMAL,
            isActive: Types.BOOLEAN,
            verified: Types.boolean,
            createdAt: Types.DATE,
            updatedAt: Types.date,
            bio: Types.TEXT,
            metadata: Types.OBJECT,
            settings: Types.JSON,
            hobbies: Types.ARRAY,
            tags: Types.array,
            uuid: Types.UUID,
            avatar: Types.BUFFER,
            status: Types.ENUM,
        }));

    const Product = await db.model(
        "products",
        new Schema({
            name: String,
            price: Number,
            inStock: Boolean,
            createdDate: Date,
            specs: Object,
            images: Array,
            sku: "UUID",
            rating: "DECIMAL",
            category: "ENUM",
            description: "TEXT",
            metadata: "JSON",
        }));

    const Order = await db.model(
        "orders",
        new Schema({
            userId: "number",
            total: "decimal",
            isGift: "boolean",
            deliveredAt: "date",
            items: "array",
            notes: "text",
            status: "enum",
            tracking: "object",
            priority: "number",
        }));

    console.log("Models created");

    // ==================== SEED DATA ====================

    await User.create({
        name: "John Doe",
        email: "john@company.com",
        age: 28,
        score: 95,
        salary: 85000.50,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-11-01"),
        bio: "Full-stack developer",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["reading", "gaming"],
        tags: ["tech", "developer"],
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Sarah Smith",
        email: "sarah@company.com",
        age: 34,
        score: 88,
        salary: 72000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-10-15"),
        bio: "Creative designer",
        metadata: { department: "Design" },
        settings: { theme: "light" },
        hobbies: ["gardening", "cooking"],
        tags: ["design", "creative"],
        uuid: "550e8400-e29b-41d4-a716-446655440001",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Mike Johnson",
        email: "mike@company.com",
        age: 42,
        score: 92,
        salary: 120000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-11-10"),
        bio: "Senior manager",
        metadata: { department: "Management" },
        settings: { theme: "dark" },
        hobbies: ["fishing", "woodworking"],
        tags: ["manager", "leader"],
        uuid: "550e8400-e29b-41d4-a716-446655440002",
        avatar: "avatar_data",
        status: "inactive",
    });

    await Product.create({
        name: "Wireless Headphones",
        price: 149.99,
        inStock: true,
        createdDate: new Date("2024-01-20"),
        specs: { battery: "30 hours" },
        images: ["headphones1.jpg"],
        sku: "550e8400-e29b-41d4-a716-446655440100",
        rating: 4.5,
        category: "electronics",
        description: "Noise-cancelling wireless headphones",
        metadata: { warranty: "2 years" },
    });

    await Product.create({
        name: "Smart Watch",
        price: 299.99,
        inStock: true,
        createdDate: new Date("2024-02-15"),
        specs: { display: "AMOLED" },
        images: ["watch1.jpg"],
        sku: "550e8400-e29b-41d4-a716-446655440101",
        rating: 4.2,
        category: "wearables",
        description: "Fitness tracker with GPS",
        metadata: { warranty: "1 year" },
    });

    await Product.create({
        name: "Organic Coffee Beans",
        price: 24.99,
        inStock: true,
        createdDate: new Date("2024-03-01"),
        specs: { origin: "Colombia" },
        images: ["coffee1.jpg"],
        sku: "550e8400-e29b-41d4-a716-446655440102",
        rating: 4.8,
        category: "food",
        description: "Fair-trade organic coffee",
        metadata: { manufacturer: "Coffee Co" },
    });

    await Order.create({
        userId: 1,
        total: 209.98,
        isGift: false,
        deliveredAt: new Date("2024-11-01"),
        items: ["Headphones", "Mouse"],
        notes: "Rush delivery",
        status: "delivered",
        tracking: { carrier: "FedEx" },
        priority: 2,
    });

    await Order.create({
        userId: 2,
        total: 64.98,
        isGift: true,
        deliveredAt: new Date("2024-11-15"),
        items: ["Yoga Mat", "Coffee"],
        notes: "",
        status: "pending",
        tracking: { carrier: "UPS" },
        priority: 3,
    });

    await Order.create({
        userId: 3,
        total: 12.99,
        isGift: true,
        deliveredAt: new Date("2024-10-20"),
        items: ["Mug"],
        notes: "Gift wrap",
        status: "delivered",
        tracking: { carrier: "USPS" },
        priority: 1,
    });

    console.log("Data seeded");

    // ==================== FIND QUERIES ====================

    const allUsers = await User.find();
    const allProducts = await Product.find();
    const allOrders = await Order.find();

    const userByName = await User.findOne({ name: "John Doe" });
    const userByEmail = await User.findOne({ email: "sarah@company.com" });
    const userAgeLte30 = await User.findOne({ age: { lte: 30 } });
    const userAgeGt30 = await User.findOne({ age: { gt: 30 } });
    const userAgeGte35 = await User.findOne({ age: { gte: 35 } });
    const userAgeLt25 = await User.findOne({ age: { lt: 25 } });
    const userAgeNe30 = await User.findOne({ age: { ne: 30 } });
    const userBetweenAge = await User.findOne({ age: { between: [25, 35] } });

    const userOr = await User.findOne({
        or: [{ name: "John Doe" }, { name: "Sarah Smith" }]
    });
    const userNot = await User.findOne({ not: { name: "John Doe" } });

    const userStartsWithJ = await User.findOne({ name: { startsWith: "J" } });
    const userEndsWithn = await User.findOne({ name: { endsWith: "n" } });
    const userContainsSmith = await User.findOne({ name: { contains: "Smith" } });

    const userNthContain = await User.findOne({ name: { nthContain: { second: "o" } } });
    const userNthContainMultiple = await User.findOne({
        name: { nthContain: { second: ["a", "e"], third: ["r", "n"] } }
    });

    const userRegex = await User.findOne({ email: { regex: ".*@company.com" } });
    const userEmailString = await User.findOne({ email: ".*@company.com" });

    const userHasEmail = await User.findOne({ email: { exists: true } });
    const userNoEmail = await User.findOne({ email: { exists: false } });
    const userEmailIsNull = await User.findOne({ email: { isNull: true } });
    const userEmailNotNull = await User.findOne({ email: { isNull: false } });

    const userInNames = await User.findOne({
        name: { in: ["John Doe", "Sarah Smith", "Mike Johnson"] }
    });
    const userNinNames = await User.findOne({
        name: { nin: ["John Doe", "David Kim"] }
    });

    const userOddId = await User.findOne({ id: { mod: [2, 1] } });
    const userEvenId = await User.findOne({ id: { mod: [2, 0] } });

    const userIlike = await User.findOne({ name: { ilike: "joh%" } });
    const userSoundex = await User.findOne({ name: { soundex: "John" } });
    const userLevenshtein = await User.findOne({ name: { levenshtein: "Jon" } });

    const userCreatedRecently = await User.findOne({
        createdAt: { dateDiff: ["now", "90 days"] }
    });

    const userDistinct = await User.findOne({
        name: { isDistinctFrom: "John Doe" }
    });

    const userAnySubquery = await User.findOne({
        age: { any: "SELECT age FROM users WHERE age > 30" }
    });
    const userAllSubquery = await User.findOne({
        age: { all: "SELECT age FROM users WHERE age < 30" }
    });

    const userWithOrders = await User.findOne({
        exists: {
            relation: "orders",
            where: { userId: "id" }
        }
    });

    const productWithText = await Product.findOne({
        description: { text: "wireless headphones" }
    });

    // FIND queries
    const usersAgeGt25 = await User.find({ age: { gt: 25 } });
    const usersAgeGte30 = await User.find({ age: { gte: 30 } });
    const usersAgeLt25 = await User.find({ age: { lt: 25 } });
    const usersAgeLte25 = await User.find({ age: { lte: 25 } });
    const usersAgeNe25 = await User.find({ age: { ne: 25 } });
    const usersBetweenAge25and35 = await User.find({ age: { between: [25, 35] } });

    const usersStartsWithM = await User.find({ name: { startsWith: "M" } });
    const usersEndsWithE = await User.find({ name: { endsWith: "e" } });
    const usersContainsA = await User.find({ name: { contains: "a" } });

    const usersWithEmail = await User.find({ email: { exists: true } });
    const usersNoEmailFind = await User.find({ email: { isNull: true } });

    const usersOrFind = await User.find({
        or: [{ name: "John Doe" }, { name: "Sarah Smith" }, { name: "Mike Johnson" }]
    });
    const usersNotFind = await User.find({ not: { name: "John Doe" } });

    const usersInFind = await User.find({
        name: { in: ["John Doe", "Sarah Smith", "Alex Turner"] }
    });
    const usersNinFind = await User.find({
        name: { nin: ["John Doe", "David Kim"] }
    });

    const usersOddIdsFind = await User.find({ id: { mod: [2, 1] } });
    const usersIlikeFind = await User.find({ name: { ilike: "j%" } });

    const deliveredOrders = await Order.find({ status: "delivered" });
    const pendingOrders = await Order.find({ status: "pending" });
    const ordersTotalGt100 = await Order.find({ total: { gt: 100 } });

    // ==================== OUTPUT ====================

    const output = {
        typeVariations: {
            "Types enum": ["User"],
            "JavaScript constructors": ["Product"],
            "String literals": ["Order"],
        },
        data: {
            users: allUsers,
            products: allProducts,
            orders: allOrders,
        },
        queries: {
            findOne: {
                userByName: userByName,
                userByEmail: userByEmail,
                userAgeLte30: userAgeLte30,
                userAgeGt30: userAgeGt30,
                userAgeGte35: userAgeGte35,
                userAgeLt25: userAgeLt25,
                userAgeNe30: userAgeNe30,
                userBetweenAge: userBetweenAge,
                userOr: userOr,
                userNot: userNot,
                userStartsWithJ: userStartsWithJ,
                userEndsWithn: userEndsWithn,
                userContainsSmith: userContainsSmith,
                userNthContain: userNthContain,
                userNthContainMultiple: userNthContainMultiple,
                userRegex: userRegex,
                userEmailString: userEmailString,
                userHasEmail: userHasEmail,
                userNoEmail: userNoEmail,
                userEmailIsNull: userEmailIsNull,
                userEmailNotNull: userEmailNotNull,
                userInNames: userInNames,
                userNinNames: userNinNames,
                userOddId: userOddId,
                userEvenId: userEvenId,
                userIlike: userIlike,
                userSoundex: userSoundex,
                userLevenshtein: userLevenshtein,
                userCreatedRecently: userCreatedRecently,
                userDistinct: userDistinct,
                userAnySubquery: userAnySubquery,
                userAllSubquery: userAllSubquery,
                userWithOrders: userWithOrders,
                productWithText: productWithText,
            },
            find: {
                usersAgeGt25: usersAgeGt25,
                usersAgeGte30: usersAgeGte30,
                usersAgeLt25: usersAgeLt25,
                usersAgeLte25: usersAgeLte25,
                usersAgeNe25: usersAgeNe25,
                usersBetweenAge25and35: usersBetweenAge25and35,
                usersStartsWithM: usersStartsWithM,
                usersEndsWithE: usersEndsWithE,
                usersContainsA: usersContainsA,
                usersWithEmail: usersWithEmail,
                usersNoEmailFind: usersNoEmailFind,
                usersOrFind: usersOrFind,
                usersNotFind: usersNotFind,
                usersInFind: usersInFind,
                usersNinFind: usersNinFind,
                usersOddIdsFind: usersOddIdsFind,
                usersIlikeFind: usersIlikeFind,
                deliveredOrders: deliveredOrders,
                pendingOrders: pendingOrders,
                ordersTotalGt100: ordersTotalGt100,
            }
        }
    };

    fs.writeFileSync(
        path.join(process.cwd(), "test-output.bridge"),
        JSON.stringify(output, null, 2)
    );

    console.log("Data written to test-output.bridge");
}

void run();