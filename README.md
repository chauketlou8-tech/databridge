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
[![Docs](https://img.shields.io/badge/docs-databridge--documentation-blue?style=for-the-badge)](https://databridge-documentation-nljdbjw22-elvis12.vercel.app)
</div>

---

## Table of Contents

- [What is DataBridge?](#what-is-databridge)
- [Features](#features)
- [Supported Databases](#supported-databases)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](https://databridge-documentation-nljdbjw22-elvis12.vercel.app)
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
| Unified Connection API    | Planned       |
| Multi-Database Support    | In Progress   |
| Model-Based Data Access   | Planned       |
| Schema Validation         | Planned       |
| Full CRUD Operations      | Planned       |
| Query Abstraction         | Planned       |
| TypeScript-First          | Designed      |
| Extensible Drivers        | Architecture  |
| Connection Pooling        | Planned       |
| Transaction Support       | Planned       |
| Migration System          | Planned       |

---

## Supported Databases

| Database    | Status          |
|-------------|-----------------|
| PostgreSQL  | In Development  |
| MySQL       | Planned         |
| MongoDB     | Planned         |
| SQLite      | Planned         |

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

For full documentation, visit [databridge-documentation](https://databridge-documentation-nljdbjw22-elvis12.vercel.app).

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

DataBridge uses a driver-based architecture:

```
Application
     |
     v
DataBridge API
     |
     +----------------+
     |                |
 PostgreSQL        MongoDB
 Driver            Driver
     |                |
     v                v
 Database          Database
```

Adding support for new databases is done by creating a new driver.

---

## Project Structure

```
database-manager/
│
├── src/
│   └── index.ts
│
├── core/
│   ├── Database.ts
│   ├── Connection.ts
│   ├── Model.ts
│   └── Collection.ts
│
├── drivers/
│   ├── postgres/
│   │   └── PostgresDriver.ts
│   ├── mysql/
│   │   └── MysqlDriver.ts
│   └── mongodb/
│       └── MongoDriver.ts
│
├── schema/
│   ├── Schema.ts
│   ├── Field.ts
│   └── Validator.ts
│
├── query/
│   ├── QueryBuilder.ts
│   └── Filter.ts
│
├── migrations/
│
├── cli/
│
├── package.json
├── tsconfig.json
└── README.md
```

### Core Modules

- **core/** - Foundation classes for database management
    - `Database.ts` - Main database interface
    - `Connection.ts` - Connection management
    - `Model.ts` - Data model definitions
    - `Collection.ts` - Collection/table operations

- **drivers/** - Database-specific implementations
    - Each database has its own driver that implements the unified API
    - New databases can be added by creating a new driver

- **schema/** - Schema definition and validation
    - `Schema.ts` - Schema definitions
    - `Field.ts` - Field type definitions
    - `Validator.ts` - Validation logic

- **query/** - Query building
    - `QueryBuilder.ts` - Fluent query interface
    - `Filter.ts` - Filter operations

- **migrations/** - Database migration system
- **cli/** - Command-line tools
- **src/** - Entry point

---

## Roadmap

### v0.1.0

- [ ] Database connection manager
- [ ] PostgreSQL support
- [ ] Basic CRUD operations
- [ ] Query builder

### v0.2.0

- [ ] MySQL support
- [ ] MongoDB support
- [ ] Schema validation
- [ ] Type-safe models

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
git clone https://github.com/yourusername/databridge.git
npm install
npm run build
npm test
```

---

<div align="center">
  <strong>Star this repo if you like it!</strong>
</div>