<div align="center">

<pre>
██████╗  █████╗ ████████╗ █████╗ ██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗
██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
██║  ██║███████║   ██║   ███████║██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗
██║  ██║██╔══██║   ██║   ██╔══██║██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝
██████╔╝██║  ██║   ██║   ██║  ██║██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝
</pre>

  <h1>DataBridge</h1>
  <p><strong>One API to rule them all</strong></p>
  <p><em>Unified database abstraction for the modern TypeScript era</em></p>

[![npm version](https://img.shields.io/badge/version-0.1.0--alpha-blue?style=for-the-badge)](https://npmjs.com/package/databridge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![Docs](https://img.shields.io/badge/docs-databridge--documentation-blue?style=for-the-badge)](https://databridge-documentation.vercel.app)
</div>

---

## Table of Contents

- [What is DataBridge?](#what-is-databridge)
- [Features](#features)
- [Supported Databases](#supported-databases)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](https://databridge-documentation.vercel.app)
- [Database Connections](#database-connections)
- [Models](#models)
- [CRUD Operations](#crud-operations)
- [Query API](#query-api)
- [Schema Validation](#schema-validation)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Philosophy](#philosophy)
- [Tech Stack](#tech-stack)
- [License](#license)
- [Contributing](#contributing)

---

## What is DataBridge?

DataBridge is a **modern, type-safe database abstraction layer** that provides a **unified API** across SQL and NoSQL databases.

Think of it as Mongoose for everything — but without the vendor lock-in.

### Why DataBridge?

- Stop learning different query languages for every database
- Stop rewriting your data layer when you switch databases
- Start building with a consistent developer experience
- Type-safe from day one with TypeScript-first design

---

## Features

| Feature                   | Status        |
|---------------------------|---------------|
| Unified Connection API    | Completed     |
| Multi-Database Support    | Completed     |
| Model-Based Data Access   | Completed     |
| Schema Validation         | Completed     |
| Full CRUD Operations      | Completed     |
| Query Abstraction         | In Progress   |
| TypeScript-First          | Completed     |
| Extensible Drivers        | Completed     |
| Connection Pooling        | Planned       |
| Transaction Support       | Planned       |
| Migration System          | Planned       |
| CLI Tools                 | In Progress   |
| IntelliJ Plugin           | In Progress   |
| Error Code System         | Completed     |

---

## Supported Databases

| Database    | Status      |
|-------------|-------------|
| PostgreSQL  | Completed   |
| MySQL       | Completed   |
| MongoDB     | Completed   |
| SQLite      | Completed   |

---

## Installation

```bash
# Using npm
npm install databridge

# Using yarn
yarn add databridge

# Using pnpm
pnpm add databridge
```

---

## Quick Start

For full documentation, visit [databridge-documentation](https://databridge-documentation.vercel.app).

```typescript
import { DataBridge, Schema } from "databridge";

const db = await DataBridge.connect({
    provider: "postgres",
    url: "postgres://localhost:5432/myapp"
});

const User = db.model(
    "User",
    new Schema({
        name: String,
        email: String,
        age: Number
    })
);

await User.create({
    name: "John",
    email: "john@example.com",
    age: 21
});

const users = await User.find();
```

---

## Database Connections

### PostgreSQL

```typescript
const db = await DataBridge.connect({
    provider: "postgres",
    url: "postgres://user:password@localhost:5432/database"
});
```

### MySQL

```typescript
const db = await DataBridge.connect({
    provider: "mysql",
    host: "localhost",
    user: "root",
    password: "password",
    database: "database"
});
```

### MongoDB

```typescript
const db = await DataBridge.connect({
    provider: "mongodb",
    url: "mongodb://localhost:27017/database"
});
```

### SQLite

```typescript
const db = await DataBridge.connect({
    provider: "sqlite",
    filename: "./database.sqlite"
});
```

---

## Models

```typescript
const Product = db.model(
    "Product",
    new Schema({
        name: String,
        price: Number,
        category: String
    })
);
```

---

## CRUD Operations

### Create

```typescript
await Product.create({
    name: "Laptop",
    price: 1200,
    category: "Technology"
});
```

### Read

```typescript
const products = await Product.find();
const product = await Product.findOne({ name: "Laptop" });
```

### Update

```typescript
await Product.update(
    { name: "Laptop" },
    { price: 1000 }
);
```

### Delete

```typescript
await Product.delete({ name: "Laptop" });
```

---

## Query API

```typescript
const users = await User
    .where("age")
    .greaterThan(18)
    .sort("name")
    .limit(10)
    .execute();
```

---

## Schema Validation

```typescript
const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 0,
        max: 150
    }
});
```

---

## Architecture

DataBridge uses a clean, driver-based architecture. For a detailed architecture flow diagram and explanation, see [Docks/ARCHITECTURE.md](Docs/ARCHITECTURE.md).

```
Application
     |
     v
DataBridge Core
     |
     +----------------+----------------+----------------+
     |                |                |                |
     v                v                v                v
PostgreSQL        MySQL          MongoDB         SQLite
  Driver           Driver          Driver          Driver
     |                |                |                |
     v                v                v                v
PostgreSQL        MySQL          MongoDB         SQLite
 Database         Database        Database        Database
```

Each database driver implements the same interface:

```typescript
interface DatabaseDriver {
    connect(config: ConnectionConfig): Promise<void>;
    disconnect(): Promise<void>;
    create<T>(model: string, data: T): Promise<T>;
    find<T>(model: string, query: Query): Promise<T[]>;
    findOne<T>(model: string, query: Query): Promise<T | null>;
    update<T>(model: string, filter: Query, data: Partial<T>): Promise<T>;
    delete(model: string, query: Query): Promise<boolean>;
}
```

### Adding a New Database

1. Create a new directory under `src/drivers/`
2. Implement the `DatabaseDriver` interface
3. Write tests
4. Update documentation

For a complete visual breakdown of how data flows through the system, check out the [detailed architecture documentation](Docs/ARCHITECTURE.md).

This architecture ensures consistency across all databases while keeping each implementation isolated.

---

## Project Structure

```
databridge/
│
├── bin/
│   └── databridge.ts
│
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   └── cli.ts
│   │
│   ├── core/
│   │   ├── DataBridge.ts
│   │   ├── Database.ts
│   │   └── index.ts
│   │
│   ├── drivers/
│   │   ├── postgresql/
│   │   │   ├── PostgreSQLDriver.ts
│   │   │   ├── PostgresQuery.ts
│   │   │   ├── Types.ts
│   │   │   └── index.ts
│   │   ├── mysql/
│   │   │   ├── MysqlDriver.ts
│   │   │   ├── MysqlQuery.ts
│   │   │   ├── Types.ts
│   │   │   └── index.ts
│   │   ├── mongodb/
│   │   │   ├── MongoDriver.ts
│   │   │   ├── MongoQuery.ts
│   │   │   ├── Types.ts
│   │   │   └── index.ts
│   │   ├── sqlite/
│   │   │   ├── SQLiteDriver.ts
│   │   │   ├── SqliteQuery.ts
│   │   │   ├── Types.ts
│   │   │   └── index.ts
│   │   ├── Driver.ts
│   │   ├── DriverFactory.ts
│   │   └── index.ts
│   │
│   ├── exceptions/
│   │   ├── ConnectionError.ts
│   │   ├── DriverError.ts
│   │   ├── ModelError.ts
│   │   ├── ProviderError.ts
│   │   ├── QueryError.ts
│   │   ├── SchemaError.ts
│   │   ├── MisMatchError.ts
│   │   ├── codes.bridge
│   │   └── index.ts
│   │
│   ├── interfaces/
│   │   ├── Database.ts
│   │   ├── Driver.ts
│   │   ├── DriverFactory.ts
│   │   ├── Model.ts
│   │   └── index.ts
│   │
│   ├── model/
│   │   ├── Document.ts
│   │   ├── Model.ts
│   │   ├── ModelFactory.ts
│   │   └── index.ts
│   │
│   ├── schema/
│   │   ├── Field.ts
│   │   ├── Schema.ts
│   │   ├── Types.bridge
│   │   ├── Types.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── config.ts
│   │   ├── query.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   └── BaseQuery.ts
│   │
│   ├── index.ts
│   └── version.ts
│
├── tests/
│   ├── PostgreSQLDriver.test.ts
│   ├── manual/
│   │   └── PostgreSQLDriver.test.ts
│   └── helpers/
│
├── Docks/
│   ├── index.html
│   ├── ARCHITECTURE.md
│   ├── getting-started/
│   ├── api/
│   ├── guides/
│   └── assets/
│
├── .gitignore
├── .npmignore
├── .npmrc
├── package.json
├── package-lock.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── HISTORY.md
└── LICENSE
```

### Core Modules

- **core/** - Foundation classes for database management
    - `DataBridge.ts` - Main entry point
    - `Database.ts` - Database interface

- **drivers/** - Database-specific implementations
    - `Driver.ts` - Abstract base driver class
    - `DriverFactory.ts` - Factory for creating drivers
    - Each database has its own driver, query handler, and type mappings

- **exceptions/** - Error classes for DataBridge
    - All errors extend from base DataBridgeError
    - Error codes defined in `codes.bridge`

- **model/** - Model and Document classes
    - `Model.ts` - Model class with CRUD operations
    - `ModelFactory.ts` - Factory for creating models
    - `Document.ts` - Document class for data records

- **schema/** - Schema definition and validation
    - `Schema.ts` - Schema definition
    - `Field.ts` - Field validation and type normalization
    - `Types.ts` - DataBridge type definitions

- **utils/** - Utility classes
    - `BaseQuery.ts` - Shared query logic for all drivers

---

## Roadmap

### v0.1.0

- [x] Database connection manager
- [x] PostgreSQL support
- [x] Basic CRUD operations
- [x] Query builder

### v0.2.0

- [x] MySQL support
- [x] MongoDB support
- [x] Schema validation
- [x] Type-safe models

### v0.3.0

- [ ] Migration system
- [ ] CLI tools
- [ ] Database introspection
- [ ] Automatic model generation

### Future

- Database GUI
- Relationship management
- Advanced query optimization
- Plugin system

---

## Philosophy

> Developers should not need to learn a completely different API every time they change databases.

Write once. Deploy anywhere.

---

## Tech Stack

- TypeScript
- Jest
- Node.js
- PostgreSQL
- MySQL
- MongoDB
- SQLite

---

## License

MIT

---

## Contributing

Contributions welcome!

```bash
git clone https://github.com/chauketlou8-tech/databridge.git
npm install
npm run build
npm test
```

---

<div align="center">
  <strong>Star this repo if you like it!</strong>
</div>