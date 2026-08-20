import { DataBridge, Schema, Types } from "../../src";
import * as fs from "fs";
import * as path from "path";

async function run() {
    const db = await DataBridge.connect({
        provider: "postgres",
        url: "postgresql://postgres:TemaSecondary0909%40@localhost:3001/testdb"
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
        age: { any: "select age from users where age > 30" }
    });
    const userAllSubquery = await User.findOne({
        age: { all: "select age from users where age < 30" }
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

    // ==================== UPDATE QUERIES ====================
// UPDATE TESTS - Only use fields that exist in the schema

    const updateJohn = await User.update({
        name: "John Doe",
        set: { age: 29 }
    });

    const updateJohnReturnAll = await User.update({
        name: "John Doe",
        set: { age: 30 }
    }, "return all");

    const updateJohnReturnFields = await User.update({
        name: "John Doe",
        set: { age: 31 }
    }, "return id, name, age");

    const updateAgeGt40 = await User.update({
        age: { gt: 40 },
        set: { status: "senior" }
    });

    const updateAgeGte30 = await User.update({
        age: { gte: 30 },
        set: { isActive: false }
    });

    const updateAgeLt25 = await User.update({
        age: { lt: 25 },
        set: { salary: 50000 }
    });

    const updateBetween = await User.update({
        age: { between: [25, 35] },
        set: { salary: 90000 }
    });

    const updateOr = await User.update({
        or: [{ name: "John Doe" }, { name: "Sarah Smith" }],
        set: { status: "active" }
    });

    const updateNot = await User.update({
        not: { name: "John Doe" },
        set: { isActive: false }
    });

    const updateStartsWith = await User.update({
        name: { startsWith: "J" },
        set: { status: "J-team" }
    });

    const updateEndsWith = await User.update({
        name: { endsWith: "e" },
        set: { status: "E-team" }
    });

    const updateContains = await User.update({
        name: { contains: "Smith" },
        set: { status: "Smith-team" }
    });

    const updateNthContain = await User.update({
        name: { nthContain: { second: "o" } },
        set: { status: "contains-o" }
    });

    const updateIn = await User.update({
        name: { in: ["John Doe", "Sarah Smith", "Mike Johnson"] },
        set: { status: "selected" }
    });

    const updateNin = await User.update({
        name: { nin: ["John Doe", "David Kim"] },
        set: { status: "not-selected" }
    });

    const updateExists = await User.update({
        email: { exists: true },
        set: { verified: true }
    });

    const updateIsNull = await User.update({
        email: { isNull: true },
        set: { verified: false }
    });

    const updateSoundex = await User.update({
        name: { soundex: "John" },
        set: { status: "soundex-match" }
    });

    const updateLevenshtein = await User.update({
        name: { levenshtein: "Jon" },
        set: { status: "fuzzy-match" }
    });

    const updateDateDiff = await User.update({
        createdAt: { dateDiff: ["now", "90 days"] },
        set: { status: "recent" }
    });

    const updateIsDistinctFrom = await User.update({
        name: { isDistinctFrom: "John Doe" },
        set: { status: "not-john" }
    });

    const updateMod = await User.update({
        id: { mod: [2, 1] },
        set: { status: "odd-id" }
    });

    const updateProductText = await Product.update({
        description: { text: "wireless headphones" },
        set: { category: "audio" }
    });

    const updateMultipleFields = await User.update({
        name: "John Doe",
        set: {
            age: 35,
            salary: 95000,
            status: "updated",
            isActive: true
        }
    });

    const updateMultipleConditions = await User.update({
        age: { gt: 25 },
        status: "active",
        set: { score: 100 }
    }, "return all");

    const updateComplex = await User.update({
        name: { startsWith: "M", endsWith: "n" },
        age: { between: [30, 50] },
        set: { status: "complex-match" }
    }, "return id, name, age, status");

    const updateAgeLte30 = await User.update({
        age: { lte: 30 },
        set: { salary: 75000 }
    });

    const updateAgeNe30 = await User.update({
        age: { ne: 30 },
        set: { status: "not-thirty" }
    });

    // ==================== UPDATE ONE QUERIES ====================

// Update one by name
    const updateOneJohn = await User.updateOne({
        name: "John Doe",
        set: { age: 32 }
    });

// Update one by name with return all
    const updateOneJohnReturnAll = await User.updateOne({
        name: "John Doe",
        set: { age: 33 }
    }, "return all");

// Update one by name with return specific fields
    const updateOneJohnReturnFields = await User.updateOne({
        name: "John Doe",
        set: { age: 34 }
    }, "return id, name, age");

// Update one by email
    const updateOneByEmail = await User.updateOne({
        email: "sarah@company.com",
        set: { status: "updated-by-email" }
    });

// Update one with gt operator
    const updateOneAgeGt40 = await User.updateOne({
        age: { gt: 40 },
        set: { status: "senior-one" }
    });

// Update one with gte operator
    const updateOneAgeGte30 = await User.updateOne({
        age: { gte: 30 },
        set: { isActive: false }
    });

// Update one with between
    const updateOneBetween = await User.updateOne({
        age: { between: [25, 35] },
        set: { salary: 85000 }
    });

// Update one with startsWith
    const updateOneStartsWith = await User.updateOne({
        name: { startsWith: "J" },
        set: { status: "J-one" }
    });

// Update one with contains
    const updateOneContains = await User.updateOne({
        name: { contains: "Smith" },
        set: { status: "Smith-one" }
    });

// Update one with in
    const updateOneIn = await User.updateOne({
        name: { in: ["John Doe", "Sarah Smith"] },
        set: { status: "in-one" }
    });

// Update one with multiple fields
    const updateOneMultipleFields = await User.updateOne({
        name: "Mike Johnson",
        set: {
            age: 45,
            salary: 130000,
            status: "updated-one"
        }
    }, "return all");

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
            },
            update: {
                updateJohn: updateJohn,
                updateJohnReturnAll: updateJohnReturnAll,
                updateJohnReturnFields: updateJohnReturnFields,
                updateAgeGt40: updateAgeGt40,
                updateAgeGte30: updateAgeGte30,
                updateAgeLt25: updateAgeLt25,
                updateAgeLte30: updateAgeLte30,
                updateAgeNe30: updateAgeNe30,
                updateBetween: updateBetween,
                updateOr: updateOr,
                updateNot: updateNot,
                updateStartsWith: updateStartsWith,
                updateEndsWith: updateEndsWith,
                updateContains: updateContains,
                updateNthContain: updateNthContain,
                updateIn: updateIn,
                updateNin: updateNin,
                updateExists: updateExists,
                updateIsNull: updateIsNull,
                updateSoundex: updateSoundex,
                updateLevenshtein: updateLevenshtein,
                updateDateDiff: updateDateDiff,
                updateIsDistinctFrom: updateIsDistinctFrom,
                updateMod: updateMod,
                updateProductText: updateProductText,
                updateMultipleFields: updateMultipleFields,
                updateMultipleConditions: updateMultipleConditions,
                updateComplex: updateComplex
            },
            updateOne: {
                updateOneJohn: updateOneJohn,
                updateOneJohnReturnAll: updateOneJohnReturnAll,
                updateOneJohnReturnFields: updateOneJohnReturnFields,
                updateOneByEmail: updateOneByEmail,
                updateOneAgeGt40: updateOneAgeGt40,
                updateOneAgeGte30: updateOneAgeGte30,
                updateOneBetween: updateOneBetween,
                updateOneStartsWith: updateOneStartsWith,
                updateOneContains: updateOneContains,
                updateOneIn: updateOneIn,
                updateOneMultipleFields: updateOneMultipleFields
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