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
        email: "john.doe@company.com",
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
        email: "sarah.smith@company.com",
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
        email: "mike.johnson@company.com",
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

    await User.create({
        name: "Alex Turner",
        email: "alex.turner@company.com",
        age: 25,
        score: 78,
        salary: 65000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-04-01"),
        updatedAt: new Date("2024-09-01"),
        bio: "Junior developer",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["coding", "music"],
        tags: ["junior", "developer"],
        uuid: "550e8400-e29b-41d4-a716-446655440003",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Emma Wilson",
        email: "emma.wilson@company.com",
        age: 29,
        score: 91,
        salary: 82000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-05-15"),
        updatedAt: new Date("2024-08-20"),
        bio: "Product manager",
        metadata: { department: "Product" },
        settings: { theme: "light" },
        hobbies: ["hiking", "photography"],
        tags: ["product", "manager"],
        uuid: "550e8400-e29b-41d4-a716-446655440004",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "David Kim",
        email: "david.kim@company.com",
        age: 38,
        score: 87,
        salary: 98000.00,
        isActive: false,
        verified: true,
        createdAt: new Date("2024-06-10"),
        updatedAt: new Date("2024-07-25"),
        bio: "Data analyst",
        metadata: { department: "Analytics" },
        settings: { theme: "dark" },
        hobbies: ["chess", "reading"],
        tags: ["analyst", "data"],
        uuid: "550e8400-e29b-41d4-a716-446655440005",
        avatar: "avatar_data",
        status: "inactive",
    });

    await User.create({
        name: "Lisa Brown",
        email: "lisa.brown@company.com",
        age: 31,
        score: 94,
        salary: 88000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-07-01"),
        updatedAt: new Date("2024-08-30"),
        bio: "UX designer",
        metadata: { department: "Design" },
        settings: { theme: "light" },
        hobbies: ["painting", "design"],
        tags: ["ux", "designer"],
        uuid: "550e8400-e29b-41d4-a716-446655440006",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "James Taylor",
        email: "james.taylor@company.com",
        age: 48,
        score: 96,
        salary: 140000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-08-05"),
        updatedAt: new Date("2024-09-15"),
        bio: "Director of Engineering",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["golf", "reading"],
        tags: ["director", "engineering"],
        uuid: "550e8400-e29b-41d4-a716-446655440007",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Maria Garcia",
        email: "maria.garcia@company.com",
        age: 26,
        score: 82,
        salary: 70000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-09-10"),
        updatedAt: new Date("2024-10-01"),
        bio: "Marketing specialist",
        metadata: { department: "Marketing" },
        settings: { theme: "light" },
        hobbies: ["writing", "travel"],
        tags: ["marketing", "specialist"],
        uuid: "550e8400-e29b-41d4-a716-446655440008",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Sophie Chen",
        email: "sophie.chen@company.com",
        age: 22,
        score: 75,
        salary: 55000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-10-01"),
        updatedAt: new Date("2024-10-20"),
        bio: "Intern",
        metadata: { department: "Engineering" },
        settings: { theme: "light" },
        hobbies: ["coding", "basketball"],
        tags: ["intern", "developer"],
        uuid: "550e8400-e29b-41d4-a716-446655440009",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Robert Chen",
        email: "robert.chen@company.com",
        age: 33,
        score: 85,
        salary: 92000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-09-01"),
        updatedAt: new Date("2024-09-20"),
        bio: "Backend engineer",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["coding", "hiking"],
        tags: ["backend", "engineer"],
        uuid: "550e8400-e29b-41d4-a716-446655440010",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Jennifer Lee",
        email: "jennifer.lee@company.com",
        age: 27,
        score: 89,
        salary: 78000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-07-15"),
        updatedAt: new Date("2024-08-25"),
        bio: "Frontend developer",
        metadata: { department: "Engineering" },
        settings: { theme: "light" },
        hobbies: ["design", "coding"],
        tags: ["frontend", "developer"],
        uuid: "550e8400-e29b-41d4-a716-446655440011",
        avatar: "avatar_data",
        status: "inactive",
    });

    await User.create({
        name: "William Park",
        email: "william.park@company.com",
        age: 44,
        score: 93,
        salary: 125000.00,
        isActive: false,
        verified: true,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-03-15"),
        bio: "DevOps lead",
        metadata: { department: "Operations" },
        settings: { theme: "dark" },
        hobbies: ["automation", "cloud"],
        tags: ["devops", "lead"],
        uuid: "550e8400-e29b-41d4-a716-446655440012",
        avatar: "avatar_data",
        status: "inactive",
    });

    await User.create({
        name: "Daniel Martinez",
        email: "daniel.martinez@company.com",
        age: 35,
        score: 84,
        salary: 89000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-07-10"),
        updatedAt: new Date("2024-08-15"),
        bio: "Systems architect",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["architecture", "devops"],
        tags: ["architect", "systems"],
        uuid: "550e8400-e29b-41d4-a716-446655440013",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Emily Watson",
        email: "emily.watson@company.com",
        age: 30,
        score: 90,
        salary: 86000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-06-20"),
        updatedAt: new Date("2024-07-30"),
        bio: "ML engineer",
        metadata: { department: "AI" },
        settings: { theme: "light" },
        hobbies: ["machine learning", "python"],
        tags: ["ml", "engineer"],
        uuid: "550e8400-e29b-41d4-a716-446655440014",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Christopher Kim",
        email: "christopher.kim@company.com",
        age: 41,
        score: 88,
        salary: 110000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-02-10"),
        bio: "Infrastructure lead",
        metadata: { department: "Operations" },
        settings: { theme: "dark" },
        hobbies: ["networking", "security"],
        tags: ["infrastructure", "lead"],
        uuid: "550e8400-e29b-41d4-a716-446655440015",
        avatar: "avatar_data",
        status: "inactive",
    });

    await User.create({
        name: "Amanda Scott",
        email: "amanda.scott@company.com",
        age: 24,
        score: 76,
        salary: 58000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-08-15"),
        updatedAt: new Date("2024-09-20"),
        bio: "Junior data analyst",
        metadata: { department: "Analytics" },
        settings: { theme: "light" },
        hobbies: ["data viz", "sql"],
        tags: ["analyst", "junior"],
        uuid: "550e8400-e29b-41d4-a716-446655440016",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Benjamin Choi",
        email: "benjamin.choi@company.com",
        age: 39,
        score: 93,
        salary: 115000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-03-15"),
        updatedAt: new Date("2024-04-20"),
        bio: "Tech lead",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["mentoring", "coding"],
        tags: ["techlead", "engineering"],
        uuid: "550e8400-e29b-41d4-a716-446655440017",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Michelle Park",
        email: "michelle.park@company.com",
        age: 32,
        score: 87,
        salary: 91000.00,
        isActive: true,
        verified: false,
        createdAt: new Date("2024-05-01"),
        updatedAt: new Date("2024-06-01"),
        bio: "Product designer",
        metadata: { department: "Design" },
        settings: { theme: "light" },
        hobbies: ["ui/ux", "prototyping"],
        tags: ["designer", "product"],
        uuid: "550e8400-e29b-41d4-a716-446655440018",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Alice Johnson",
        email: "alice.johnson@company.com",
        age: 28,
        score: 80,
        salary: 60000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-20"),
        bio: "DeleteOne simple equality test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440019",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Brian Smith",
        email: "brian.smith@company.com",
        age: 29,
        score: 81,
        salary: 61000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-21"),
        bio: "DeleteOne email test",
        metadata: { department: "Marketing" },
        settings: { theme: "light" },
        hobbies: ["testing", "reading"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440020",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Carlos Garcia",
        email: "carlos.garcia@company.com",
        age: 45,
        score: 82,
        salary: 90000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-22"),
        bio: "DeleteOne gt test",
        metadata: { department: "Operations" },
        settings: { theme: "dark" },
        hobbies: ["testing", "sports"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440021",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Diana Martinez",
        email: "diana.martinez@company.com",
        age: 36,
        score: 83,
        salary: 91000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-13"),
        updatedAt: new Date("2024-01-23"),
        bio: "DeleteOne gte test",
        metadata: { department: "Finance" },
        settings: { theme: "dark" },
        hobbies: ["testing", "music"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440022",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Ethan Wilson",
        email: "ethan.wilson@company.com",
        age: 23,
        score: 84,
        salary: 50000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-14"),
        updatedAt: new Date("2024-01-24"),
        bio: "DeleteOne lt test",
        metadata: { department: "Engineering" },
        settings: { theme: "light" },
        hobbies: ["testing", "gaming"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440023",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Fiona Brown",
        email: "fiona.brown@company.com",
        age: 30,
        score: 85,
        salary: 62000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-25"),
        bio: "DeleteOne lte test",
        metadata: { department: "Design" },
        settings: { theme: "light" },
        hobbies: ["testing", "reading"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440024",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "George Taylor",
        email: "george.taylor@company.com",
        age: 31,
        score: 86,
        salary: 63000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-16"),
        updatedAt: new Date("2024-01-26"),
        bio: "DeleteOne ne test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "sports"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440025",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Hannah Lee",
        email: "hannah.lee@company.com",
        age: 27,
        score: 87,
        salary: 64000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-17"),
        updatedAt: new Date("2024-01-27"),
        bio: "DeleteOne between test",
        metadata: { department: "Analytics" },
        settings: { theme: "dark" },
        hobbies: ["testing", "music"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440026",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Ian Chen",
        email: "ian.chen@company.com",
        age: 28,
        score: 88,
        salary: 65000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-18"),
        updatedAt: new Date("2024-01-28"),
        bio: "DeleteOne OR test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440027",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Jessica Park",
        email: "jessica.park@company.com",
        age: 29,
        score: 89,
        salary: 66000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-19"),
        updatedAt: new Date("2024-01-29"),
        bio: "DeleteOne NOT test",
        metadata: { department: "Product" },
        settings: { theme: "light" },
        hobbies: ["testing", "design"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440028",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Kevin Kim",
        email: "kevin.kim@company.com",
        age: 30,
        score: 90,
        salary: 67000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-30"),
        bio: "DeleteOne startsWith test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "hiking"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440029",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Laura Scott",
        email: "laura.scott@company.com",
        age: 32,
        score: 91,
        salary: 68000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-21"),
        updatedAt: new Date("2024-01-31"),
        bio: "DeleteOne endsWith test",
        metadata: { department: "Analytics" },
        settings: { theme: "light" },
        hobbies: ["testing", "reading"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440030",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Michael Choi",
        email: "michael.choi@company.com",
        age: 33,
        score: 92,
        salary: 69000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-22"),
        updatedAt: new Date("2024-02-01"),
        bio: "DeleteOne contains test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440031",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Nicole Martinez",
        email: "nicole.martinez@company.com",
        age: 34,
        score: 93,
        salary: 70000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-23"),
        updatedAt: new Date("2024-02-02"),
        bio: "DeleteOne nthContain test",
        metadata: { department: "Design" },
        settings: { theme: "light" },
        hobbies: ["testing", "music"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440032",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Oliver Garcia",
        email: "oliver.garcia@company.com",
        age: 35,
        score: 94,
        salary: 71000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-24"),
        updatedAt: new Date("2024-02-03"),
        bio: "DeleteOne IN test",
        metadata: { department: "Operations" },
        settings: { theme: "dark" },
        hobbies: ["testing", "sports"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440033",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Patricia Wilson",
        email: "patricia.wilson@company.com",
        age: 36,
        score: 95,
        salary: 72000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-02-04"),
        bio: "DeleteOne NIN test",
        metadata: { department: "Finance" },
        settings: { theme: "light" },
        hobbies: ["testing", "reading"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440034",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Quentin Smith",
        email: "quentin.smith@company.com",
        age: 37,
        score: 96,
        salary: 73000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-26"),
        updatedAt: new Date("2024-02-05"),
        bio: "DeleteOne exists test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440035",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Rachel Brown",
        email: "rachel.brown@company.com",
        age: 38,
        score: 97,
        salary: 74000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-27"),
        updatedAt: new Date("2024-02-06"),
        bio: "DeleteOne isNull test",
        metadata: { department: "Analytics" },
        settings: { theme: "light" },
        hobbies: ["testing", "music"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440036",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Samuel Johnson",
        email: "samuel.johnson@company.com",
        age: 39,
        score: 98,
        salary: 75000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-28"),
        updatedAt: new Date("2024-02-07"),
        bio: "DeleteOne soundex test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "reading"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440037",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Robert Chen",
        email: "robert.chen@company.com",
        age: 40,
        score: 99,
        salary: 76000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-29"),
        updatedAt: new Date("2024-02-08"),
        bio: "DeleteOne levenshtein test",
        metadata: { department: "Engineering" },
        settings: { theme: "light" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440038",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "David Kim",
        email: "david.kim@company.com",
        age: 41,
        score: 100,
        salary: 77000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2026-08-01"),
        updatedAt: new Date("2026-08-10"),
        bio: "DeleteOne dateDiff test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440039",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Emily Watson",
        email: "emily.watson@company.com",
        age: 42,
        score: 77,
        salary: 78000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-01-31"),
        updatedAt: new Date("2024-02-11"),
        bio: "DeleteOne distinct test",
        metadata: { department: "Design" },
        settings: { theme: "light" },
        hobbies: ["testing", "design"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440040",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Christopher Kim",
        email: "christopher.kim@company.com",
        age: 43,
        score: 78,
        salary: 79000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-12"),
        bio: "DeleteOne mod test",
        metadata: { department: "Operations" },
        settings: { theme: "dark" },
        hobbies: ["testing", "sports"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440041",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Amanda Scott",
        email: "amanda.scott@company.com",
        age: 44,
        score: 79,
        salary: 80000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-02-02"),
        updatedAt: new Date("2024-02-13"),
        bio: "DeleteOne ilike test",
        metadata: { department: "Analytics" },
        settings: { theme: "light" },
        hobbies: ["testing", "reading"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440042",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Benjamin Choi",
        email: "benjamin.choi@company.com",
        age: 45,
        score: 80,
        salary: 81000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-02-03"),
        updatedAt: new Date("2024-02-14"),
        bio: "DeleteOne regex test",
        metadata: { department: "Engineering" },
        settings: { theme: "dark" },
        hobbies: ["testing", "coding"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440043",
        avatar: "avatar_data",
        status: "active",
    });

    await User.create({
        name: "Michelle Park",
        email: "michelle.park@company.com",
        age: 26,
        score: 81,
        salary: 82000.00,
        isActive: true,
        verified: true,
        createdAt: new Date("2024-02-04"),
        updatedAt: new Date("2024-02-15"),
        bio: "DeleteOne multiple condition test",
        metadata: { department: "Marketing" },
        settings: { theme: "light" },
        hobbies: ["testing", "writing"],
        tags: ["deleteOne"],
        uuid: "650e8400-e29b-41d4-a716-446655440044",
        avatar: "avatar_data",
        status: "active",
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

// ==================== FIND ONE QUERIES ====================

    const userByName = await User.findOne({ name: "John Doe" });
    const userByEmail = await User.findOne({ email: "sarah.smith@company.com" });
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

// ==================== UPDATE QUERIES ====================
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

    const updateAgeLte30 = await User.update({
        age: { lte: 30 },
        set: { salary: 75000 }
    });

    const updateAgeNe30 = await User.update({
        age: { ne: 30 },
        set: { status: "not-thirty" }
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

// ==================== UPDATE ONE QUERIES ====================

    const updateOneJohn = await User.updateOne({
        name: "John Doe",
        set: { age: 32 }
    });

    const updateOneJohnReturnAll = await User.updateOne({
        name: "John Doe",
        set: { age: 33 }
    }, "return all");

    const updateOneJohnReturnFields = await User.updateOne({
        name: "John Doe",
        set: { age: 34 }
    }, "return id, name, age");

    const updateOneByEmail = await User.updateOne({
        email: "sarah.smith@company.com",
        set: { status: "updated-by-email" }
    });

    const updateOneAgeGt40 = await User.updateOne({
        age: { gt: 40 },
        set: { status: "senior-one" }
    });

    const updateOneAgeGte30 = await User.updateOne({
        age: { gte: 30 },
        set: { isActive: false }
    });

    const updateOneBetween = await User.updateOne({
        age: { between: [25, 35] },
        set: { salary: 85000 }
    });

    const updateOneStartsWith = await User.updateOne({
        name: { startsWith: "J" },
        set: { status: "J-one" }
    });

    const updateOneContains = await User.updateOne({
        name: { contains: "Smith" },
        set: { status: "Smith-one" }
    });

    const updateOneIn = await User.updateOne({
        name: { in: ["John Doe", "Sarah Smith"] },
        set: { status: "in-one" }
    });

    const updateOneMultipleFields = await User.updateOne({
        name: "Mike Johnson",
        set: {
            age: 45,
            salary: 130000,
            status: "updated-one"
        }
    }, "return all");

// ==================== FIND AND UPDATE QUERIES ====================

    const findAndUpdateJohn = await User.findAndUpdate({
        name: "John Doe",
        set: { age: 40 }
    });

    const findAndUpdateByEmail = await User.findAndUpdate({
        email: "sarah.smith@company.com",
        set: { status: "find-updated" }
    });

    const findAndUpdateAgeGt40 = await User.findAndUpdate({
        age: { gt: 40 },
        set: { status: "find-updated-senior" }
    });

    const findAndUpdateBetween = await User.findAndUpdate({
        age: { between: [25, 35] },
        set: { salary: 100000 }
    });

    const findAndUpdateStartsWith = await User.findAndUpdate({
        name: { startsWith: "J" },
        set: { status: "find-updated-J" }
    });

    const findAndUpdateMultipleFields = await User.findAndUpdate({
        name: "Mike Johnson",
        set: {
            age: 50,
            salary: 150000,
            status: "find-updated-multiple"
        }
    });

// ==================== DELETE ONE QUERIES ====================

    const deleteOneAlice = await User.deleteOne({ name: "Alice Johnson" });
    const deleteOneBrian = await User.deleteOne({ email: "brian.smith@company.com" });
    const deleteOneCarlos = await User.deleteOne({ age: { gt: 40 } });
    const deleteOneDiana = await User.deleteOne({ age: { gte: 30 } });
    const deleteOneEthan = await User.deleteOne({ age: { lt: 25 } });
    const deleteOneFiona = await User.deleteOne({ age: { lte: 30 } });
    const deleteOneGeorge = await User.deleteOne({ age: { ne: 30 } });
    const deleteOneHannah = await User.deleteOne({ age: { between: [25, 35] } });
    const deleteOneIan = await User.deleteOne({
        or: [{ name: "Ian Chen" }, { name: "Jessica Park" }]
    });
    const deleteOneJessica = await User.deleteOne({
        not: { name: "Kevin Kim" }
    });
    const deleteOneKevin = await User.deleteOne({
        name: { startsWith: "K" }
    });
    const deleteOneLaura = await User.deleteOne({
        name: { endsWith: "a" }
    });
    const deleteOneMichael = await User.deleteOne({
        name: { contains: "Choi" }
    });
    const deleteOneNicole = await User.deleteOne({
        name: { nthContain: { second: "i" } }
    });
    const deleteOneOliver = await User.deleteOne({
        name: { in: ["Oliver Garcia", "Patricia Wilson"] }
    });
    const deleteOnePatricia = await User.deleteOne({
        name: { nin: ["Quentin Smith", "Rachel Brown"] }
    });
    const deleteOneQuentin = await User.deleteOne({
        email: { exists: true }
    });
    const deleteOneRachel = await User.deleteOne({
        email: { isNull: false }
    });
    const deleteOneSamuel = await User.deleteOne({
        name: { soundex: "Samuel" }
    });
    const deleteOneRobert = await User.deleteOne({
        name: { levenshtein: "Rob" }
    });
    const deleteOneDavid = await User.deleteOne({
        createdAt: { dateDiff: ["now", "90 days"] }
    });
    const deleteOneEmily = await User.deleteOne({
        name: { isDistinctFrom: "Christopher Kim" }
    });
    const deleteOneChristopher = await User.deleteOne({
        id: { mod: [2, 0] }
    });
    const deleteOneAmanda = await User.deleteOne({
        name: { ilike: "a%" }
    });
    const deleteOneBenjamin = await User.deleteOne({
        email: { regex: ".*@company.com" }
    });
    const deleteOneMichelle = await User.deleteOne({
        name: "Michelle Park"
    });

// ==================== FIND AND DELETE QUERIES ====================

    const findAndDeleteJohn = await Product.findAndDelete({
        name: "Wireless Headphones"
    });

// ==================== DELETE QUERIES ====================

    const deleteJohn = await User.delete({ name: "John Doe" });
    const deleteByEmail = await User.delete({ email: "sarah.smith@company.com" });
    const deleteAgeGt40 = await User.delete({ age: { gt: 40 } });
    const deleteAgeGte30 = await User.delete({ age: { gte: 30 } });
    const deleteAgeLt25 = await User.delete({ age: { lt: 25 } });
    const deleteAgeLte30 = await User.delete({ age: { lte: 30 } });
    const deleteBetween = await User.delete({ age: { between: [25, 35] } });
    const deleteOr = await User.delete({
        or: [{ name: "John Doe" }, { name: "Sarah Smith" }]
    });
    const deleteNot = await User.delete({ not: { name: "John Doe" } });
    const deleteStartsWith = await User.delete({ name: { startsWith: "J" } });
    const deleteEndsWith = await User.delete({ name: { endsWith: "e" } });
    const deleteContains = await User.delete({ name: { contains: "Smith" } });
    const deleteNthContain = await User.delete({ name: { nthContain: { second: "o" } } });
    const deleteIn = await User.delete({
        name: { in: ["John Doe", "Sarah Smith", "Mike Johnson"] }
    });
    const deleteNin = await User.delete({
        name: { nin: ["John Doe", "David Kim"] }
    });
    const deleteExists = await User.delete({ email: { exists: true } });
    const deleteIsNull = await User.delete({ email: { isNull: true } });
    const deleteSoundex = await User.delete({ name: { soundex: "John" } });
    const deleteLevenshtein = await User.delete({ name: { levenshtein: "Jon" } });
    const deleteDateDiff = await User.delete({
        createdAt: { dateDiff: ["now", "90 days"] }
    });
    const deleteIsDistinctFrom = await User.delete({
        name: { isDistinctFrom: "John Doe" }
    });
    const deleteMod = await User.delete({ id: { mod: [2, 1] } });
    const deleteIlike = await User.delete({ name: { ilike: "j%" } });
    const deleteRegex = await User.delete({ email: { regex: ".*@company.com" } });
    const deleteMultipleConditions = await User.delete({
        age: { gt: 25 },
        status: "active"
    });

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
            },
            findAndUpdate: {
                findAndUpdateJohn: findAndUpdateJohn,
                findAndUpdateByEmail: findAndUpdateByEmail,
                findAndUpdateAgeGt40: findAndUpdateAgeGt40,
                findAndUpdateBetween: findAndUpdateBetween,
                findAndUpdateStartsWith: findAndUpdateStartsWith,
                findAndUpdateMultipleFields: findAndUpdateMultipleFields
            },
            delete: {
                deleteJohn: deleteJohn,
                deleteByEmail: deleteByEmail,
                deleteAgeGt40: deleteAgeGt40,
                deleteAgeGte30: deleteAgeGte30,
                deleteAgeLt25: deleteAgeLt25,
                deleteAgeLte30: deleteAgeLte30,
                deleteBetween: deleteBetween,
                deleteOr: deleteOr,
                deleteNot: deleteNot,
                deleteStartsWith: deleteStartsWith,
                deleteEndsWith: deleteEndsWith,
                deleteContains: deleteContains,
                deleteNthContain: deleteNthContain,
                deleteIn: deleteIn,
                deleteNin: deleteNin,
                deleteExists: deleteExists,
                deleteIsNull: deleteIsNull,
                deleteSoundex: deleteSoundex,
                deleteLevenshtein: deleteLevenshtein,
                deleteDateDiff: deleteDateDiff,
                deleteIsDistinctFrom: deleteIsDistinctFrom,
                deleteMod: deleteMod,
                deleteIlike: deleteIlike,
                deleteRegex: deleteRegex,
                deleteMultipleConditions: deleteMultipleConditions
            },
            deleteOne: {
                deleteOneAlice: deleteOneAlice,
                deleteOneBrian: deleteOneBrian,
                deleteOneCarlos: deleteOneCarlos,
                deleteOneDiana: deleteOneDiana,
                deleteOneEthan: deleteOneEthan,
                deleteOneFiona: deleteOneFiona,
                deleteOneGeorge: deleteOneGeorge,
                deleteOneHannah: deleteOneHannah,
                deleteOneIan: deleteOneIan,
                deleteOneJessica: deleteOneJessica,
                deleteOneKevin: deleteOneKevin,
                deleteOneLaura: deleteOneLaura,
                deleteOneMichael: deleteOneMichael,
                deleteOneNicole: deleteOneNicole,
                deleteOneOliver: deleteOneOliver,
                deleteOnePatricia: deleteOnePatricia,
                deleteOneQuentin: deleteOneQuentin,
                deleteOneRachel: deleteOneRachel,
                deleteOneSamuel: deleteOneSamuel,
                deleteOneRobert: deleteOneRobert,
                deleteOneDavid: deleteOneDavid,
                deleteOneEmily: deleteOneEmily,
                deleteOneChristopher: deleteOneChristopher,
                deleteOneAmanda: deleteOneAmanda,
                deleteOneBenjamin: deleteOneBenjamin,
                deleteOneMichelle: deleteOneMichelle
            },
            findAndDelete: {
                findAndDeleteJohn: findAndDeleteJohn,
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