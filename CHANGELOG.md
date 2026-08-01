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
- MongoDB support
- SQLite support
- Core CRUD operations (create, read, update, delete)
- Query builder with fluent interface
- Schema definition and validation
- TypeScript type definitions
- PostgreSQL driver implementation
- MySQL driver implementation
- MongoDB driver implementation
- SQLite driver implementation
- Model-based data access
- Extensible driver architecture
- Connection pooling
- Migration system
- CLI tools
- Unit and integration tests
- Error codes system (D001-D081)
- BaseQuery utility for shared query logic
- Type normalization for schema fields (String, "string", Types.STRING)
- Document class for data records
- ModelFactory for creating models
- Manual and Jest tests for all drivers
- IntelliJ IDEA plugin for .bridge files

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

---

[Unreleased]: https://github.com/chauketlou8-tech/databridge/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/chauketlou8-tech/databridge/releases/tag/v1.0.0