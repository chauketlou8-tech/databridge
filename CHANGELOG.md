# Changelog

All notable changes to DataBridge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- README.md documentation
- CONTRIBUTING.md guide
- CHANGELOG.md
- DataBridge logo
- GitIgnore
- NpmIgnore
- npmrc
- Docks
- Documentation website

## [1.0.0] - TBD

### Added
- Database connection manager
- PostgreSQL support
- MySQL support
- MariaDB support
- MongoDB support
- SQLite support
- CouchDB support
- Core CRUD operations (create, read, update, delete)
- Query builder with fluent interface
- Schema definition and validation
- TypeScript type definitions
- PostgreSQL driver implementation
- MySQL driver implementation
- MariaDB driver implementation
- MongoDB driver implementation
- SQLite driver implementation
- CouchDB driver implementation
- Model-based data access
- Extensible driver architecture
- Connection pooling
- Migration system
- CLI tools with commands: version, help, driver:list
- Unit and integration tests
- Error codes system (D001-D081)
- BaseQuery utility for shared query logic
- Type normalization for schema fields (String, "string", Types.STRING)
- Document class for data records
- ModelFactory for creating models
- Manual and Jest tests for all drivers
- IntelliJ IDEA plugin for .bridge files
- Documentation website with guides for all databases
- MariaDB guide and documentation
- CouchDB guide and documentation
- Auto-sliding database carousel on homepage
- Particle animation background on hero section
- Query operators: or, not, between, in
- Data validation against schema for CouchDB
- MariaDB and MySQL drivers with full query support
- Shared utility methods in BaseQuery: getWhere(), getFieldTypes(), sterilizeResult(), processRowData()
- Result sterilization for SQL-based drivers to return proper JavaScript types
- Query operators: gt, gte, lt, lte, ne, nin, regex, startsWith, endsWith, contains, nthContain, mod, elemMatch, size, any, all, text, ilike, soundex, levenshtein, dateDiff, isDistinctFrom, isNull, exists, expr

### Fixed
- Type mismatch between Driver interface and abstract Driver class
- Missing status codes in ConnectionError and DriverError
- PostgreSQL connection URL regex to properly extract database name
- MongoDB connection to correctly extract database name from URL
- MySQL connection to handle ER_BAD_DB_ERROR and create database if not exists
- SQLite connection to properly handle file paths and memory databases
- Field.ts type validation to properly normalize types
- Model.create() type checking to use normalized string types
- MongoQuery to use getBsonType() mapping
- Duplicate connection logic in DataBridge.connect() and DriverFactory
- Top-level await issues in manual tests
- Jest test timeout issues for connection failure tests
- BaseQuery to remove repetitive read() logic across all drivers
- Model.ts to properly handle field validation and mismatch errors
- Database.ts to properly pass driver to ModelFactory
- All driver query methods to accept Query type instead of string
- Carousel infinite scroll glitch with CSS animation approach
- MariaDB and MySQL query result destructuring to properly return arrays
- PostgreSQL `in` operator placeholder generation bug
- MariaDB `between` operator SQL generation
- CouchDB duplicate document insertion check
- CLI commands to reflect actual functionality
- MariaDB and MySQL table exists check
- SQLite query return type to Promise<any>
- Duplicate getWhere() methods removed from all drivers, now inherited from BaseQuery
- Duplicate getFieldTypes() methods removed from SQL drivers, now inherited from BaseQuery
- Duplicate sterilizeResult() methods removed from SQL drivers, now inherited from BaseQuery
- Duplicate processRowData() logic moved to BaseQuery for SQL drivers
- Boolean values now properly returned as true/false instead of 1/0 in SQL-based drivers
- Date values now properly converted to ISO format in SQL-based drivers
- JSON/ARRAY fields now properly parsed in SQL-based drivers
- BUFFER fields now properly reconstructed in SQL-based drivers
- PostgreSQL text operator to properly format tsquery for multi-word searches

---

[Unreleased]: https://github.com/chauketlou8-tech/databridge/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/chauketlou8-tech/databridge/releases/tag/v1.0.0