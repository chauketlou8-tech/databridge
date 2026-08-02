# History

This file provides a chronological history of the DataBridge project, documenting major milestones, releases, and significant changes over time. It serves as a timeline for understanding the project's evolution.

## 1.0.0-alpha

### 2026-07-29

#### Project Created
- DataBridge project initialized
- Repository created on GitHub
- Project structure established

#### Documentation Added
- README.md - Project overview and documentation
- CONTRIBUTING.md - Guidelines for contributors
- CHANGELOG.md - Version history and release notes
- SECURITY.md - Security policy and reporting guidelines
- HISTORY.md - Project timeline and milestones

#### Documentation Website
- Documentation website created
- Deployed to Vercel
- URL: [databridge-documentation.vercel.app](https://databridge-documentation.vercel.app)
- Includes: Homepage, Getting Started, API Reference, and Database Guides

#### Setup
- Package.json configured
- TypeScript setup completed
- Basic project structure created

### 2026-07-30

#### Source Code Added
- src/index.ts - Main entry point
- src/version.ts - Version information
- src/cli/ - Command-line interface
    - cli.ts - CLI entry point
    - index.ts - CLI exports
- src/core/ - Core functionality
    - DataBridge.ts - Main DataBridge class
    - Database.ts - Database class
- src/interfaces/ - TypeScript interfaces
    - DataBridge.ts - DataBridge interface
    - Database.ts - Database interface
- src/types/ - Type definitions
    - config.ts - Configuration types
- tests/ - Test files
    - cli.test.ts - CLI tests

#### Documentation Added
- ARCHITECTURE.md - Outline of the workflow of DataBridge

### 2026-07-31

#### Plugin Development
- databridge-plugin folder created
- IntelliJ IDEA plugin for .bridge files
- Moved to projects/databridge/databridge-plugin
- Plugin features:
    - .bridge file type registration
    - Custom icon for .bridge files
    - Syntax highlighting support
    - Color settings page for customization
- Plugin structure:
    - src/main/kotlin/ - Kotlin source files
    - src/main/resources/icons/ - Plugin icons
    - build.gradle.kts - Gradle build configuration
    - plugin.xml - Plugin configuration

#### Source Code Added
- src/drivers/DriverFactory.ts - Factory class for creating database drivers
- src/drivers/Driver.ts - Abstract base driver class
- src/drivers/postgresql/ - PostgreSQL driver implementation
    - PostgreSQLDriver.ts - PostgreSQL database driver
    - PostgresQuery.ts - PostgreSQL query handler
    - Types.ts - PostgreSQL type mappings
    - index.ts - PostgreSQL exports
- src/drivers/mysql/ - MySQL driver implementation
    - MysqlDriver.ts - MySQL database driver
    - MysqlQuery.ts - MySQL query handler
    - Types.ts - MySQL type mappings
    - index.ts - MySQL exports
- src/drivers/mariadb/ - MariaDB driver implementation
    - MariaDriver.ts - MariaDB database driver
    - MariaQuery.ts - MariaDB query handler
    - Types.ts - MariaDB type mappings
    - index.ts - MariaDB exports
- src/drivers/mongodb/ - MongoDB driver implementation
    - MongoDriver.ts - MongoDB database driver
    - MongoQuery.ts - MongoDB query handler
    - Types.ts - MongoDB type mappings
    - index.ts - MongoDB exports
- src/drivers/sqlite/ - SQLite driver implementation
    - SQLiteDriver.ts - SQLite database driver
    - SqliteQuery.ts - SQLite query handler
    - Types.ts - SQLite type mappings
    - index.ts - SQLite exports
- src/interfaces/Driver.ts - Driver interface
- src/interfaces/DriverFactory.ts - DriverFactory interface
- src/interfaces/Database.ts - Database interface
- src/interfaces/Model.ts - Model interface
- src/exceptions/ - Error classes for DataBridge
    - ProviderError.ts - Provider related errors
    - ConnectionError.ts - Connection related errors
    - DriverError.ts - Driver related errors
    - ModelError.ts - Model related errors
    - QueryError.ts - Query related errors
    - SchemaError.ts - Schema related errors
    - MisMatchError.ts - Mismatch related errors
- src/model/ - Model and Document classes
    - Model.ts - Model class with CRUD operations
    - ModelFactory.ts - Factory for creating models
    - Document.ts - Document class
- src/schema/ - Schema and Field classes
    - Schema.ts - Schema definition and validation
    - Field.ts - Field class with type validation
    - Types.ts - DataBridge type definitions and normalization
    - Types.bridge - DataBridge type definitions file
- src/types/ - Type definitions
    - config.ts - Configuration types
    - query.ts - Query types
- src/utils/ - Utility classes
    - BaseQuery.ts - Base query handler with common logic
- tests/PostgreSQLDriver.test.ts - Jest tests for PostgreSQL driver
- tests/manual/PostgreSQLDriver.test.ts - Manual tests for PostgreSQL driver
- tests/MariaDriver.test.ts - Jest tests for MariaDB driver
- tests/manual/MariaDriver.test.ts - Manual tests for MariaDB driver
- tests/MariaQuery.test.ts - Jest tests for MariaDB query handler
- tests/manual/MariaQuery.test.ts - Manual tests for MariaDB query handler
- Error codes system implemented:
    - D001-D006: Provider errors
    - D010-D016: Connection errors
    - D020-D025: Driver errors
    - D030-D036: Query errors
    - D040-D045: Schema errors
    - D050-D055: Model errors
    - D060-D063: Transaction errors
    - D080-D081: Special errors

#### Bugs Fixed
- Fixed type mismatch between Driver interface and abstract Driver class
- Fixed missing status codes in ConnectionError and DriverError
- Fixed PostgreSQL connection URL regex to properly extract database name
- Fixed MongoDB connection to correctly extract database name from URL
- Fixed MySQL connection to handle ER_BAD_DB_ERROR and create database if not exists
- Fixed SQLite connection to properly handle file paths and memory databases
- Fixed Field.ts type validation to properly normalize types (String, "string", Types.STRING)
- Fixed Model.create() type checking to use normalized string types instead of native constructors
- Fixed MongoQuery to use getBsonType() mapping instead of manual type conversion
- Fixed duplicate connection logic in DataBridge.connect() and DriverFactory
- Fixed top-level await issues in manual tests by wrapping in async function
- Fixed Jest test timeout issues for connection failure tests
- Fixed BaseQuery to remove repetitive read() logic across all drivers
- Fixed Model.ts to properly handle field validation and mismatch errors
- Fixed Database.ts to properly pass driver to ModelFactory
- Fixed all driver query methods to accept Query type instead of string
- Fixed error codes to include D015, D016, D025, D035, D036, D045, D055, D080, D081
- Fixed MariaDB driver implementation to extend MySQL driver pattern

### 2026-08-02

#### Source Code Added
- src/drivers/mariadb/ - MariaDB driver implementation
    - MariaDriver.ts - MariaDB database driver
    - MariaQuery.ts - MariaDB query handler
    - Types.ts - MariaDB type mappings
    - index.ts - MariaDB exports
- tests/MariaDriver.test.ts - Jest tests for MariaDB driver
- tests/manual/MariaDriver.test.ts - Manual tests for MariaDB driver
- tests/MariaQuery.test.ts - Jest tests for MariaDB query handler
- tests/manual/MariaQuery.test.ts - Manual tests for MariaDB query handler

#### Documentation Updated
- README.md - Added MariaDB to supported databases
- Docks/index.html - Added MariaDB to homepage
- Docks/guides/mariadb.html - MariaDB guide page
- Updated guide navigation flow: PostgreSQL → MySQL → MariaDB → MongoDB → SQLite
- Added MariaDB connection examples in documentation