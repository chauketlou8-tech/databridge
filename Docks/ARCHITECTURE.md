# DataBridge Architecture

DataBridge follows a modular, driver-based architecture that separates concerns and provides a consistent API across multiple databases. This document explains the flow of data through the system.

## Overview

The architecture consists of three main layers:

1. **API Layer** - The public interface that developers interact with
2. **Core Layer** - The internal logic that handles models, schemas, and queries
3. **Driver Layer** - Database-specific implementations that translate generic operations to native database commands

---

## Application Flow

```
Application
│
│  import { DataBridge, Schema } from "databridge";
│
▼
src/index.ts
│
│  Exports the public API
│
├──────────────► src/core/DataBridge.test.ts
│
└──────────────► src/schema/Schema.ts
                      │
                      ▼
              Schema object created
                      │
                      │ (stored for later)
                      ▼
```

When a developer imports DataBridge, they get access to the main `DataBridge` class and the `Schema` builder. The `DataBridge` class handles database connections and model management, while `Schema` defines data structures.

---

## DataBridge.connect()

```
src/core/DataBridge.test.ts
        │
        ▼
src/config/
        │
        ▼
Validate connection options
        │
        ▼
src/drivers/DriverFactory.ts
        │
        ▼
Select provider
        │
        ├────────► PostgreSQL
        │
        ├────────► MySQL
        │
        ├────────► MongoDB
        │
        └────────► SQLite
        │
        ▼
src/drivers/postgres/PostgreSQLDriver.ts
        │
        ▼
src/core/Connection.ts
        │
        ▼
Open database connection
        │
        ▼
src/core/Database.ts
        │
        ▼
return db
```

When `DataBridge.connect()` is called, the connection options are validated, the appropriate driver is selected based on the provider, and a database connection is established. The driver handles all provider-specific connection logic, while the `Connection` class manages the connection lifecycle.

---

## db.model()

```
Database.ts
        │
        ▼
src/model/ModelFactory.ts
        │
        ▼
src/model/Model.ts
        │
        ├────────► receives Schema object
        │
        └────────► binds driver
        │
        ▼
return User model
```

The `model()` method creates a new model instance. The `ModelFactory` handles the instantiation, and the `Model` class is responsible for all data operations on that model. Each model is bound to a specific driver, which it uses for database operations.

---

## User.create()

```
Model.ts
        │
        ▼
src/query/
        │
        ▼
Build INSERT query
        │
        ▼
Driver (PostgreSQLDriver)
        │
        ▼
Convert generic query
        │
        ▼
PostgreSQL SQL
        │
        ▼
Database
        │
        ▼
Result
        │
        ▼
Return created object
```

When `create()` is called on a model, the `Model` class constructs a generic query using the query builder. This query is passed to the driver, which translates it into native SQL (or database-specific syntax). The database executes the query, and the result is returned as a JavaScript object.

---

## User.find()

```
Model.ts
        │
        ▼
src/query/
        │
        ▼
Build SELECT query
        │
        ▼
Driver (PostgreSQLDriver)
        │
        ▼
Convert generic query
        │
        ▼
SELECT * FROM users;
        │
        ▼
Database
        │
        ▼
Rows
        │
        ▼
Driver converts rows
        │
        ▼
Model returns JavaScript objects
        │
        ▼
users
```

The `find()` method follows the same flow as `create()`, but builds a SELECT query instead. The driver handles the translation to database-specific syntax, executes the query, and converts the result rows back into JavaScript objects.

---

## Key Components

### Core Components

| Component | Responsibility |
|-----------|---------------|
| DataBridge | Main entry point, manages connections and drivers |
| Database | Represents a database connection, provides model creation |
| Connection | Manages the connection lifecycle |
| Model | Represents a collection/table, handles CRUD operations |
| Schema | Defines data structure and validation rules |

### Driver Components

| Component | Responsibility |
|-----------|---------------|
| DriverFactory | Selects and instantiates the correct driver |
| PostgreSQLDriver | PostgreSQL-specific implementation |
| MySQLDriver | MySQL-specific implementation |
| MongoDBDriver | MongoDB-specific implementation |
| SQLiteDriver | SQLite-specific implementation |

### Query Components

| Component | Responsibility |
|-----------|---------------|
| QueryBuilder | Builds generic queries using a fluent interface |
| Filter | Handles filtering and conditions |
| Operators | Provides comparison and logical operators |

---

## Data Flow Summary

1. **Application** imports DataBridge and creates a Schema
2. **DataBridge.connect()** validates options, selects driver, establishes connection
3. **db.model()** creates a Model bound to the driver and Schema
4. **Model operations** (create, find, update, delete) build generic queries
5. **Driver** translates generic queries to native database commands
6. **Database** executes the commands
7. **Driver** converts results back to JavaScript objects
8. **Model** returns the results to the application

This architecture ensures consistency across all supported databases while keeping each implementation isolated and maintainable.